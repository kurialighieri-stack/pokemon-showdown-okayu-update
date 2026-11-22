"""Build the Windows manager; optionally bundle official embedded Python."""
import argparse,hashlib,json,zipfile
from pathlib import Path
PYTHON_SHA256='91d828c2da3a029b41699e918674a0cb379c02cf20dab9c501306885f837402a'
ROOT=Path(__file__).resolve().parents[1]

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--python-zip',type=Path,help='Optional official Python 3.13.9 embedded x64 ZIP; omitted by default')
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    if args.python_zip and hashlib.sha256(args.python_zip.read_bytes()).hexdigest()!=PYTHON_SHA256:parser.error('Expected python-3.13.9-embed-amd64.zip from python.org')
    args.output.parent.mkdir(parents=True,exist_ok=True)
    prefix='Okayu-Update-Windows/'
    with zipfile.ZipFile(args.output,'w',zipfile.ZIP_DEFLATED) as out:
        for directory in ['okayu_update','modules','compatibility','docs','tools','tests']:
            for path in sorted((ROOT/directory).rglob('*')):
                relative=path.relative_to(ROOT).as_posix()
                if not path.is_file() or '__pycache__' in path.parts or relative.startswith('modules/glass/'):continue
                if relative=='modules/index.json':
                    out.writestr(prefix+relative,json.dumps([m for m in json.loads(path.read_text(encoding='utf-8')) if m!='glass'])+'\n')
                else:out.write(path,prefix+relative)
        for name in ['Okayu-Update.cmd','README.md','LICENSE','THIRD_PARTY_NOTICES.md','AI_DISCLOSURE.md','CONTRIBUTING.md']:
            out.write(ROOT/name,prefix+name)
        out.writestr(prefix+'LEEME-WINDOWS.txt','Abre Okayu-Update.cmd. Instrucciones: docs/WINDOWS.md.\nPython 3.10 o posterior: https://www.python.org/downloads/windows/\nPro 1.2.0 Windows x64: https://github.com/Ryukotsuki/PokemonShowdownPro/releases/tag/v1.2.0\nGlass no está incluido.\n')
        if args.python_zip:
            with zipfile.ZipFile(args.python_zip) as runtime:
                for info in runtime.infolist():
                    data=runtime.read(info)
                    if info.filename.endswith('._pth'):data=b'python313.zip\n.\n..\n'
                    out.writestr(prefix+'runtime/'+info.filename,data)
    print(args.output.resolve())

if __name__=='__main__':main()
