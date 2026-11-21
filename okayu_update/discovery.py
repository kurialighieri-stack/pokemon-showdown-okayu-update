"""Bounded installation discovery and persistent AppImage preparation."""
from __future__ import annotations
import configparser,fcntl,hashlib,json,os,re,shlex,shutil,stat,subprocess,tempfile,itertools
from dataclasses import dataclass
from pathlib import Path
from .manager import Manager,ModError,atomic,app_root

@dataclass(frozen=True)
class Installation:
    path: Path
    kind: str
    version: str=''
    prepared: bool=False
    @property
    def label(self):
        if self.prepared:return 'Showdown Pro — preparado para Okayu'
        return 'Showdown Pro — AppImage original' if self.kind=='appimage' else 'Showdown Pro — instalación detectada'

def data_directory():
    return Path(os.environ.get('OKAYU_UPDATE_DATA',Path(os.environ.get('XDG_DATA_HOME',Path.home()/'.local/share'))/'pokemon-showdown-okayu-update')).expanduser().resolve()

def temporary_mount(path):return any(p.startswith('.mount_') for p in Path(path).parts)

def image_file(path):
    path=Path(path)
    try:
        if not path.is_file() or path.suffix.lower()!='.appimage':return False
        with path.open('rb') as f:header=f.read(12)
        return header[:4]==b'\x7fELF' and header[8:11] in (b'AI\x01',b'AI\x02')
    except OSError:return False

def inspect(path):
    try:
        path=Path(path).expanduser().resolve()
        if temporary_mount(path):return None
        if image_file(path):
            match=re.search(r'(\d+\.\d+\.\d+)',path.name)
            return Installation(path,'appimage',match.group(1) if match else '')
        if path.is_file() and path.name in ('AppRun','pokemon-showdown-pro','pokemon-showdown-pro.bin'):path=path.parent
        root=app_root(path);package=json.loads((root/'package.json').read_text())
        if package.get('name')!='pokemon-showdown-pro':return None
        install=root.parents[1];metadata=install/'okayu-source.json'
        return Installation(install,'directory',str(package.get('version','')),metadata.is_file())
    except (OSError,ValueError,ModError):return None

def desktop_targets(file):
    try:
        config=configparser.ConfigParser(interpolation=None,strict=False);config.read(file)
        entry=config['Desktop Entry']
        if entry.get('Type')!='Application':return []
        # Parse command arguments; never execute an Exec value or match terminal working directories.
        args=shlex.split(entry.get('Exec',''))
        return [Path(x.replace('%%','%')) for x in args if x.startswith('/') and (x.lower().endswith('.appimage') or Path(x).name in ('AppRun','pokemon-showdown-pro','pokemon-showdown-pro.bin'))]
    except (OSError,ValueError,configparser.Error,KeyError):return []

def process_targets(proc=Path('/proc')):
    if not proc.exists():return
    for item in proc.iterdir():
        if not item.name.isdigit():continue
        try:
            exe=(item/'exe').resolve(strict=True)
            basename=exe.name.lower()
            if basename not in ('pokemon-showdown-pro.bin','pokemon-showdown-pro') and not ('pokemonshowdownpro' in basename and basename.endswith('.appimage')):continue
            args=(item/'cmdline').read_bytes().split(b'\0')
            if any(arg.startswith(b'--type=') for arg in args):continue
            if image_file(exe):yield exe;continue
            if temporary_mount(exe):
                # Only this application process's APPIMAGE field is used; no environment is logged.
                for field in (item/'environ').read_bytes().split(b'\0'):
                    if field.startswith(b'APPIMAGE='):
                        yield Path(os.fsdecode(field[len(b'APPIMAGE='): ]));break
            else:yield exe.parent
        except (OSError,ValueError):continue

def children(folder,limit):
    try:return list(itertools.islice(Path(folder).iterdir(),limit))
    except OSError:return []

def discover(home=None,data=None,application_dirs=None,search_dirs=None,proc=Path('/proc')):
    home=Path(home or Path.home());data=Path(data or data_directory());candidates=[]
    def add(path):
        candidate=inspect(path)
        if candidate and candidate.path not in {c.path for c in candidates}:candidates.append(candidate)
    settings=data/'settings.json'
    try:add(json.loads(settings.read_text())['lastTarget'])
    except (OSError,ValueError,KeyError):pass
    managed=data/'managed'
    if managed.is_dir():
        for p in children(managed,100):
            if p.is_dir() and not p.name.startswith('.'):add(p)
    dirs=application_dirs if application_dirs is not None else [Path(os.environ.get('XDG_DATA_HOME',home/'.local/share'))/'applications',home/'.local/share/applications',Path('/usr/local/share/applications'),Path('/usr/share/applications')]
    for folder in dirs:
        if Path(folder).is_dir():
            for p in children(folder,2000):
                if p.suffix!='.desktop':continue
                if 'showdown' in p.name.lower() or 'okayu' in p.name.lower():
                    for target in desktop_targets(p):add(target)
    for target in process_targets(proc):add(target)
    roots=search_dirs if search_dirs is not None else [home/'Applications',home/'Aplicaciones',home/'Downloads',home/'Descargas',home/'Desktop',home/'Escritorio']
    # Only common locations and one subdirectory level; never scan the whole home or disk.
    for folder in roots:
        folder=Path(folder)
        if not folder.is_dir():continue
        entries=children(folder,1000)
        for entry in entries:
            if entry.is_dir():
                add(entry)
                if entry.name=='squashfs-root':continue
                for child in children(entry,100) if not entry.is_symlink() else []:
                    if child.is_dir() and child.name in ('squashfs-root','resources'):add(child if child.name=='squashfs-root' else child.parent)
            elif 'showdown' in entry.name.lower() and entry.suffix.lower()=='.appimage':add(entry)
    # Hide an unchanged source image when its persistent prepared installation is available.
    sources={}
    for c in candidates:
        if c.prepared:
            try:
                meta=json.loads((c.path/'okayu-source.json').read_text());sources[meta['source']] = meta
            except (OSError,ValueError,KeyError):pass
    result=[]
    for c in candidates:
        if c.kind=='appimage' and str(c.path) in sources:
            m=sources[str(c.path)];s=c.path.stat()
            if m.get('size')==s.st_size and m.get('mtimeNs')==s.st_mtime_ns:continue
        result.append(c)
    return sorted(result,key=lambda c:(not c.prepared,c.kind!='directory',str(c.path)))

def remember(target,data=None):
    data=Path(data or data_directory());atomic(data/'settings.json',(json.dumps({'lastTarget':str(Path(target).resolve())})+'\n').encode())

def file_hash(path):
    h=hashlib.sha256()
    with Path(path).open('rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
    return h.hexdigest()

def prepare_image(image,data=None):
    image=Path(image).expanduser().resolve();data=Path(data or data_directory())
    if not image_file(image):raise ModError('Selecciona un archivo AppImage válido de Pokémon Showdown Pro.')
    digest=file_hash(image);managed=data/'managed';managed.mkdir(parents=True,exist_ok=True)
    target=managed/('showdown-pro-'+digest[:16])
    with (managed/'.import.lock').open('a') as lock:
        try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        except BlockingIOError:raise ModError('Ya se está preparando otro AppImage. Espera a que termine.')
        if target.is_symlink():raise ModError('El destino administrado es un enlace y no se modificará.')
        if target.exists():
            try:meta=json.loads((target/'okayu-source.json').read_text())
            except (OSError,ValueError):raise ModError('El destino existe pero no se reconoce. Se conserva sin sobrescribirlo.')
            if meta.get('sha256')!=digest or not inspect(target):raise ModError('La instalación preparada no coincide con el AppImage.')
            remember(target,data);return target
        log=data/'last-import.log'
        with tempfile.TemporaryDirectory(prefix='.preparing-',dir=managed) as tmp:
            tmp=Path(tmp);executable=image
            if not os.access(image,os.X_OK):
                executable=tmp/'source.AppImage';shutil.copy2(image,executable);executable.chmod(executable.stat().st_mode|stat.S_IXUSR)
            with log.open('w') as output:
                result=subprocess.run([str(executable),'--appimage-extract'],cwd=tmp,stdout=output,stderr=subprocess.STDOUT)
            if result.returncode:raise ModError('No se pudo preparar el AppImage. El detalle está en last-import.log; el archivo original no se modificó.')
            extracted=tmp/'squashfs-root';candidate=inspect(extracted)
            if not candidate:raise ModError('El AppImage no contiene una distribución reconocida de Pokémon Showdown Pro.')
            Manager(extracted,state=data).prepare([],build=False)
            if file_hash(image)!=digest:raise ModError('El AppImage cambió durante la preparación; vuelve a intentarlo.')
            s=image.stat();metadata={'sha256':digest,'source':str(image),'size':s.st_size,'mtimeNs':s.st_mtime_ns}
            (extracted/'okayu-source.json').write_text(json.dumps(metadata,indent=2)+'\n')
            extracted.rename(target)
        remember(target,data);return target

def create_shortcut(target,application_dir=None):
    target=Path(target).resolve();launch=target/'AppRun'
    if not launch.is_file():return None
    folder=Path(application_dir or Path(os.environ.get('XDG_DATA_HOME',Path.home()/'.local/share'))/'applications')
    shortcut=folder/'pokemon-showdown-okayu-update.desktop'
    marker='X-Okayu-Update-Managed=true'
    if shortcut.exists() and marker not in shortcut.read_text():raise ModError('Ya existe un acceso Okayu personalizado; no se reemplazará.')
    quote=lambda value:'"'+str(value).replace('\\','\\\\').replace('"','\\"').replace('`','\\`').replace('$','\\$').replace('%','%%')+'"'
    native_icon=target/'resources/app/app/assets/icons/icon.png'
    icon=native_icon if native_icon.is_file() else target/'pokemon-showdown-pro.png'
    try:modules=json.loads((target/'resources/app/app/okayu-update-installed.json').read_text()).get('modules',[])
    except (OSError,ValueError):modules=[]
    app_class='pokemon-showdown-okayu-update' if 'theme-okayu' in modules else 'pokemon-showdown-pro'
    text='\n'.join(['[Desktop Entry]','Type=Application','Name=Pokemon Showdown: Okayu Update','Comment=Pokémon Showdown Pro con los módulos instalados por Okayu Update','Exec='+quote(launch),'Icon='+(str(icon) if icon.is_file() else 'applications-games'),'Terminal=false','Categories=Game;','StartupWMClass='+app_class,marker,''])
    atomic(shortcut,text.encode());return shortcut

def remove_shortcut(target,application_dir=None):
    folder=Path(application_dir or Path(os.environ.get('XDG_DATA_HOME',Path.home()/'.local/share'))/'applications')
    shortcut=folder/'pokemon-showdown-okayu-update.desktop'
    if not shortcut.is_file():return
    text=shortcut.read_text()
    if 'X-Okayu-Update-Managed=true' not in text:return
    for candidate in desktop_targets(shortcut):
        if candidate==Path(target).resolve()/'AppRun':shortcut.unlink();return
