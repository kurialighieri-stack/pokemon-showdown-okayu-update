"""Run native controls on a test installation using Pro's isolated smoke profile."""
import argparse,os,subprocess
from pathlib import Path

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--installation',type=Path,required=True)
    parser.add_argument('--evidence',type=Path,required=True)
    parser.add_argument('--profile',type=Path,required=True)
    parser.add_argument('--skip-capture',action='store_true',help='Use DOM assertions when Electron capturePage is unavailable')
    args=parser.parse_args();repo=Path(__file__).resolve().parents[1]
    root=args.installation.resolve();out=args.evidence.resolve();out.mkdir(parents=True,exist_ok=True)
    script=root/'resources/app/scripts/audit-theater-hub.cjs';original=script.read_bytes()
    env={**os.environ,'SHOWDOWN_PRO_SMOKE_PROFILE':str(args.profile.resolve()),'CONTROLS_EVIDENCE':str(out),'OKAYU_CONTROLS_TEST':str(repo/'tests/native-battle-controls.cjs')}
    if args.skip_capture:env['CONTROLS_SKIP_CAPTURE']='1'
    try:
        script.write_bytes((repo/'tests/windows-runtime.cjs').read_bytes())
        with (out/'native-test.log').open('w',encoding='utf-8') as log:
            result=subprocess.run([str(root/'Pokemon Showdown Pro.exe'),'--smoke-test','--new-client','--theater-only'],env=env,stdout=log,stderr=subprocess.STDOUT,timeout=150)
        return result.returncode
    finally:script.write_bytes(original)

if __name__=='__main__':raise SystemExit(main())
