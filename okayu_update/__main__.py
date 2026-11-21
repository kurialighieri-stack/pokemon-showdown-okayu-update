import argparse,json,subprocess,sys,os,shutil
from pathlib import Path
from .manager import Manager,ModError,VERSION

def dialog(*args):
    result=subprocess.run(['zenity',*args],text=True,capture_output=True)
    if result.returncode:raise KeyboardInterrupt
    return result.stdout.strip()

def gui():
    if not shutil.which('zenity'):raise ModError('La interfaz gráfica necesita Zenity. También puedes utilizar los comandos indicados con --help.')
    title='Pokemon Showdown: Okayu Update'
    action=dialog('--list','--title='+title,'--text=Selecciona una operación. La aplicación debe estar cerrada para instalar o revertir.','--column=Operación','Instalar / cambiar módulos','Revertir modificaciones','Estado / diagnóstico','Recuperar interrupción','Abrir aplicación','Extraer AppImage','--width=600','--height=340')
    if action=='Extraer AppImage':
        image=dialog('--file-selection','--title=Selecciona el AppImage original','--file-filter=AppImage | *.AppImage')
        parent=Path(dialog('--file-selection','--directory','--title=Carpeta donde instalar la distribución extraída'))
        if (parent/'squashfs-root').exists():raise ModError('Ya existe squashfs-root en esa carpeta. Elige otra para evitar sobrescribirla.')
        subprocess.run([image,'--appimage-extract'],cwd=parent,check=True,stdout=subprocess.DEVNULL)
        dialog('--info','--title='+title,'--text=Extracción terminada. El AppImage original se conserva. Selecciona squashfs-root al instalar módulos.');return
    target=dialog('--file-selection','--directory','--title=Selecciona la carpeta de Showdown Pro (AppRun o resources/app)')
    m=Manager(target)
    if action.startswith('Instalar'):
        options=[]
        for mod in m.catalog():
            if mod['id']=='core':continue
            options.extend(['TRUE' if mod['id']!='showdown-plus' else 'FALSE',mod['id'],mod['name']])
        selected=dialog('--list','--checklist','--title='+title,'--text=Elige los módulos. Okayu y los idiomas de Calcdex requieren compilar; la primera vez necesita conexión.','--column=Instalar','--column=ID','--column=Módulo','--print-column=2','--separator=,','--width=760','--height=360',*options).split(',')
        if not selected or selected==['']:raise ModError('No seleccionaste módulos')
        xpi=None
        if 'showdown-plus' in selected:xpi=dialog('--file-selection','--title=Importar XPI oficial Showdown+ 1.4','--file-filter=XPI | *.xpi')
        dialog('--question','--title='+title,'--text=Se respaldarán y modificarán los archivos compatibles de esta instalación. Se conservará el perfil de Showdown. ¿Instalar los módulos seleccionados?')
        result=m.apply(selected,xpi=xpi)
    elif action=='Revertir modificaciones':
        dialog('--question','--title='+title,'--text=Se restaurarán los archivos respaldados solo si coinciden con la modificación registrada. ¿Revertir?');result=m.revert()
    elif action=='Recuperar interrupción':result=m.recover()
    elif action=='Abrir aplicación':
        status=m.status()
        if status['state'] in ('changed','recovery-required'):raise ModError('La instalación cambió o está pendiente de recuperación. Revisa el diagnóstico antes de abrirla.')
        launch=m.root.parents[1]/'AppRun'
        if not launch.is_file():raise ModError('No se encontró AppRun. Abre el ejecutable original de esta instalación.')
        subprocess.Popen([str(launch)],start_new_session=True);return
    else:
        destination=Path(dialog('--file-selection','--save','--confirm-overwrite','--filename=okayu-diagnostic.json','--title=Guardar diagnóstico sin datos del perfil'))
        destination.write_text(json.dumps(m.diagnostic(),indent=2)+'\n');result={'diagnosticSaved':True}
    dialog('--info','--title='+title,'--text='+json.dumps(result,indent=2,ensure_ascii=False))

def main():
    parser=argparse.ArgumentParser(description='Pokemon Showdown: Okayu Update — gestor reversible de módulos para Linux')
    parser.add_argument('--version',action='version',version=VERSION)
    sub=parser.add_subparsers(dest='command')
    sub.add_parser('gui')
    for name in ['status','diagnose','plan','apply','revert','recover']:
        p=sub.add_parser(name);p.add_argument('installation');p.add_argument('--data',help='Carpeta externa de respaldos y registros')
        if name in ('plan','apply'):
            p.add_argument('--modules',default='performance,battle-messages,theme-okayu,calcdex-languages',help='IDs separados por comas; Showdown+ se importa por separado')
            p.add_argument('--xpi');p.add_argument('--showdex-source',help='Checkout verificado de Showdex para reutilizar dependencias de desarrollo')
    args=parser.parse_args()
    try:
        if args.command in (None,'gui'):return gui()
        m=Manager(args.installation,args.data)
        if args.command=='status':result=m.status()
        elif args.command=='diagnose':result=m.diagnostic()
        elif args.command=='plan':
            p=m.prepare(args.modules.split(','),args.xpi,args.showdex_source,build=False)
            result={'appVersion':m.version,'modules':p['modules'],'changedFiles':sorted(p['files']),'rebuildShowdex':p['rebuildShowdex'],'installationModified':False}
        elif args.command=='apply':result=m.apply(args.modules.split(','),args.xpi,args.showdex_source)
        elif args.command=='revert':result=m.revert()
        else:result=m.recover()
        print(json.dumps(result,indent=2,ensure_ascii=False))
    except KeyboardInterrupt:return 130
    except (ModError,OSError,ValueError,subprocess.CalledProcessError) as error:
        message=str(error);print('Okayu Update: '+message,file=sys.stderr)
        if args.command in (None,'gui') and shutil.which('zenity'):subprocess.run(['zenity','--error','--title=Okayu Update','--text='+message])
        return 1

if __name__=='__main__':sys.exit(main())
