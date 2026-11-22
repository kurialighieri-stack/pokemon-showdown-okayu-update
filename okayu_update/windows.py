"""Windows dialogs, verified ZIP preparation and owned Start menu shortcuts."""
import json,os,subprocess,tempfile,shutil
from pathlib import Path
from .platforms import data_directory,file_lock,launcher,long_path,native_path
from .manager import ModError,Manager,atomic,unpack

ZIP_SHA256='7b572264df34ec77bc6c2edd3f18ca439f737a7ef0a0ea9306492ed60ca2abd8'

def powershell(script,env=None):
    return subprocess.run(['powershell.exe','-NoProfile','-NonInteractive','-Command',script],env=env,text=True,encoding='utf-8',capture_output=True,creationflags=subprocess.CREATE_NO_WINDOW,check=True).stdout.strip()

def dialog(*args):
    script=Path(__file__).with_name('windows-dialog.ps1')
    with tempfile.TemporaryDirectory(prefix='okayu-dialog-') as tmp:
        request=Path(tmp)/'request.json';request.write_text(json.dumps(args),encoding='utf-8')
        result=subprocess.run(['powershell.exe','-NoProfile','-STA','-ExecutionPolicy','Bypass','-File',str(script),str(request)],text=True,encoding='utf-8',capture_output=True,creationflags=subprocess.CREATE_NO_WINDOW)
    if result.returncode==130:raise KeyboardInterrupt
    if result.returncode:raise ModError('No se pudo abrir el diálogo de Windows: '+result.stderr.strip())
    return result.stdout.strip()

def prepare_zip(archive,data=None):
    from .discovery import file_hash,remember
    archive=long_path(archive);data=long_path(data or data_directory());managed=data/'managed';managed.mkdir(parents=True,exist_ok=True)
    if file_hash(archive)!=ZIP_SHA256:raise ModError('El ZIP no coincide con la distribución oficial Windows x64 de Pro 1.2.0.')
    target=managed/('showdown-pro-windows-'+ZIP_SHA256[:16])
    with file_lock(managed/'.import.lock'):
        if target.is_symlink():raise ModError('El destino administrado es un enlace.')
        if target.exists():
            try:metadata=json.loads((target/'okayu-source.json').read_text())
            except (OSError,ValueError):raise ModError('El destino ya existe y no se reconoce. Se conserva sin sobrescribirlo.')
            if metadata.get('sha256')!=ZIP_SHA256:raise ModError('El destino no coincide con el ZIP.')
            Manager(target,state=data).prepare([],build=False)
            remember(target,data);return target
        with tempfile.TemporaryDirectory(prefix='.preparing-',dir=managed) as tmp:
            tmp=Path(tmp);snapshot=tmp/'source.zip';shutil.copyfile(archive,snapshot)
            if file_hash(snapshot)!=ZIP_SHA256:raise ModError('El ZIP cambió durante la preparación.')
            extracted=tmp/'app';unpack(snapshot,extracted)
            Manager(extracted,state=data).prepare([],build=False)
            (extracted/'okayu-source.json').write_text(json.dumps({'sha256':ZIP_SHA256,'source':str(archive)})+'\n')
            extracted.rename(target)
        remember(target,data);return target

def shortcut_path(folder=None):
    return Path(folder or Path(os.environ['APPDATA'])/'Microsoft/Windows/Start Menu/Programs')/'Pokemon Showdown - Okayu Update.lnk'

def shortcut_info(path):
    return powershell("[Console]::OutputEncoding=[Text.UTF8Encoding]::new(); $s=(New-Object -ComObject WScript.Shell).CreateShortcut($env:OKAYU_LINK); @{target=$s.TargetPath;description=$s.Description}|ConvertTo-Json -Compress",{**os.environ,'OKAYU_LINK':str(path)})

def create_shortcut(target,application_dir=None):
    target=Path(target).resolve();exe=launcher(target);path=shortcut_path(application_dir);path.parent.mkdir(parents=True,exist_ok=True)
    if path.exists() and json.loads(shortcut_info(path)).get('description')!='Okayu Update managed shortcut':raise ModError('Ya existe un acceso personalizado; se conserva.')
    # PNG remains the native Electron window icon; Windows Shell needs an ICO.
    icon=target/'resources/app/app/assets/icons/okayu-icon.ico'
    if not icon.is_file():icon=exe
    env={**os.environ,'OKAYU_LINK':native_path(path),'OKAYU_EXE':native_path(exe),'OKAYU_CWD':native_path(target),'OKAYU_ICON':native_path(icon)}
    powershell("$s=(New-Object -ComObject WScript.Shell).CreateShortcut($env:OKAYU_LINK); $s.TargetPath=$env:OKAYU_EXE; $s.WorkingDirectory=$env:OKAYU_CWD; $s.Description='Okayu Update managed shortcut'; $s.IconLocation=$env:OKAYU_ICON; $s.Save()",env)
    return path

def remove_shortcut(target,application_dir=None):
    path=shortcut_path(application_dir)
    if not path.exists():return
    info=json.loads(shortcut_info(path))
    if info.get('description')=='Okayu Update managed shortcut' and Path(info['target']).resolve()==launcher(Path(target).resolve()):path.unlink()
