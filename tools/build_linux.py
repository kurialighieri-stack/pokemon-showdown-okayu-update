"""Package the Linux manager with external Python and no third-party XPI."""
import argparse,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args();args.output.parent.mkdir(parents=True,exist_ok=True)
    paths=[]
    for name in ['okayu_update','modules','compatibility','docs','tools','tests']:
        paths.extend(p for p in (ROOT/name).rglob('*') if p.is_file() and '__pycache__' not in p.parts)
    paths.extend(ROOT/name for name in ['Okayu-Update.sh','README.md','LICENSE','THIRD_PARTY_NOTICES.md','AI_DISCLOSURE.md','CONTRIBUTING.md','pyproject.toml'])
    with zipfile.ZipFile(args.output,'w',zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(paths):
            relative=path.relative_to(ROOT).as_posix();data=path.read_bytes()
            if path.suffix not in ('.png','.ico','.zip','.xpi'):data=data.replace(b'\r\n',b'\n')
            info=zipfile.ZipInfo('Okayu-Update-Linux/'+relative)
            info.create_system=3;info.external_attr=(0o100755 if relative=='Okayu-Update.sh' else 0o100644)<<16
            info.compress_type=zipfile.ZIP_DEFLATED;archive.writestr(info,data)
        archive.writestr('Okayu-Update-Linux/LEEME-LINUX.txt','Requiere Python 3.10 o posterior y Zenity para la interfaz grafica.\nAbre una terminal en esta carpeta y ejecuta: sh Okayu-Update.sh\nConsulta README.md. El XPI de Showdown+ se importa por separado con este gestor Python.\n')
    print(args.output.resolve())

if __name__=='__main__':main()
