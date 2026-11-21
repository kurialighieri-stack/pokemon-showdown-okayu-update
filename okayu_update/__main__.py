import argparse,json,subprocess,sys,os,shutil,webbrowser
from pathlib import Path
from .manager import Manager,ModError,VERSION
from .discovery import discover,inspect,prepare_image,remember,create_shortcut,data_directory,image_file,remove_shortcut

def dialog(*args):
    result=subprocess.run(['zenity',*args],text=True,capture_output=True)
    if result.returncode:raise KeyboardInterrupt
    return result.stdout.strip()

def progress(text,operation):
    indicator=subprocess.Popen(['zenity','--progress','--pulsate','--auto-close','--no-cancel','--title=Okayu Update','--text='+text],stdin=subprocess.PIPE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,text=True)
    try:return operation()
    finally:
        try:indicator.communicate('100\n',timeout=5)
        except (BrokenPipeError,subprocess.TimeoutExpired):indicator.terminate()

def choose_installation(for_install=False):
    found=discover()
    # A single recognized installation needs no folder-picker detour.
    if len(found)==1:
        selected=found[0]
    else:
        rows=[]
        for index,candidate in enumerate(found):rows.extend([candidate.label,candidate.version or 'Por comprobar',str(candidate.path),'found:'+str(index)])
        rows.extend(['Elegir archivo AppImage…','','Selecciona el archivo que descargaste','image',
                     'Elegir carpeta… (avanzado)','','Solo para una distribución ya extraída','folder'])
        choice=dialog('--list','--title=Encontrar Pokémon Showdown Pro',
            '--text='+('Encontramos estas opciones. No necesitas buscar la carpeta interna de la aplicación.' if found else 'No encontramos Showdown Pro automáticamente. Elige su archivo AppImage; nosotros preparamos la carpeta.'),
            '--column=Aplicación','--column=Versión','--column=Ubicación','--column=ID','--hide-column=4','--print-column=4','--width=900','--height=360',*rows)
        if choice=='image':
            selected=inspect(dialog('--file-selection','--title=Elige el AppImage de Pokémon Showdown Pro','--file-filter=AppImage | *.AppImage *.appimage'))
        elif choice=='folder':
            selected=inspect(dialog('--file-selection','--directory','--title=Elige una distribución extraída de Showdown Pro'))
        else:
            try:selected=found[int(choice.split(':')[1])]
            except (ValueError,IndexError):raise ModError('Selecciona una de las opciones de Showdown Pro.')
        if not selected:raise ModError('No se reconoció Showdown Pro. Si usas AppImage, elige el archivo descargado, no una carpeta /tmp/.mount_.')
    if selected.kind=='appimage':
        if not for_install:raise ModError('Este AppImage todavía no está preparado para Okayu. Elige «Instalar / cambiar módulos» primero.')
        dialog('--question','--title=Preparar Showdown Pro para Okayu',
            '--text=Encontramos el AppImage original. Prepararemos una instalación fija automáticamente y conservaremos el archivo original. Después de instalar, tendrás un acceso «Pokemon Showdown: Okayu Update» en el menú.\n\nArchivo: '+str(selected.path),
            '--ok-label=Preparar','--cancel-label=Cancelar')
        target=progress('Preparando Showdown Pro. Se conservará tu AppImage original…',lambda:prepare_image(selected.path))
    else:target=selected.path
    remember(target);return target

def choose_showdown_xpi(spec):
    from .xpi import discover_xpis,validate_xpi,RELEASE_URL,MOZILLA_URL
    found=progress('Buscando Showdown+ en los perfiles de Firefox, Flatpak y Snap…',lambda:discover_xpis(spec))
    while True:
        rows=[]
        for index,item in enumerate(found):
            rows.extend([item.browser+' · '+item.profile,item.origin+' · v'+item.version,str(item.path),'found:'+str(index)])
        rows.extend(['Seleccionar XPI manualmente…','Mozilla o GitHub v1.4','Se verificará SHA-256 y compatibilidad','manual',
                     'Descargar desde GitHub Releases','Oficial · v1.4',RELEASE_URL,'github',
                     'Descargar desde Mozilla','Oficial · v1.4',MOZILLA_URL,'mozilla'])
        choice=dialog('--list','--title=Importar Showdown+ 1.4',
            '--text=Reutiliza una extensión instalada o selecciona un XPI descargado. Solo se lee el original; la adaptación se hace en una copia privada.\nSe admiten únicamente los dos paquetes oficiales verificados de la versión 1.4.',
            '--column=Origen / perfil','--column=Paquete','--column=Archivo / enlace','--column=ID','--hide-column=4','--print-column=4','--width=1000','--height=380',*rows)
        if choice in ('github','mozilla'):
            webbrowser.open(RELEASE_URL if choice=='github' else MOZILLA_URL)
            dialog('--info','--title=Descargar Showdown+',
                '--text=Descarga el archivo .xpi oficial (en GitHub: pokemon-showdown-hd.xpi, en Assets). Cuando termine, continúa y selecciónalo. No necesitas instalarlo en Firefox.')
            choice='manual'
        if choice=='manual':
            package=dialog('--file-selection','--title=Seleccionar XPI oficial Showdown+ 1.4','--file-filter=XPI | *.xpi')
        else:
            try:package=found[int(choice.split(':')[1])].path
            except (ValueError,IndexError):raise ModError('Selecciona un archivo XPI o una de las opciones de descarga.')
        # apply() validates a fresh private copy again, including on file changes.
        progress('Verificando SHA-256 y compatibilidad del XPI…',lambda:validate_xpi(package,spec))
        return str(package)

def gui():
    if not shutil.which('zenity'):raise ModError('La interfaz gráfica necesita Zenity. También puedes utilizar los comandos indicados con --help.')
    title='Pokemon Showdown: Okayu Update'
    action=dialog('--list','--title='+title,'--text=Buscaremos Showdown Pro automáticamente. Cierra la aplicación antes de instalar o revertir.','--column=Operación','Instalar / cambiar módulos','Abrir aplicación','Revertir modificaciones','Estado / diagnóstico','Recuperar interrupción','--width=620','--height=330')
    target=choose_installation(for_install=action.startswith('Instalar'));m=Manager(target)
    if action.startswith('Instalar'):
        options=[]
        for mod in m.catalog():
            if mod['id']=='core':continue
            options.extend(['TRUE' if mod['id'] not in ('showdown-plus','glass') else 'FALSE',mod['id'],mod['name']])
        selected=dialog('--list','--checklist','--title='+title,'--text=Elige los módulos. La primera compilación de Calcdex necesita conexión y puede tardar varios minutos.','--column=Instalar','--column=ID','--column=Módulo','--print-column=2','--separator=,','--width=760','--height=360',*options).split(',')
        if not selected or selected==['']:raise ModError('No seleccionaste módulos')
        xpi=None
        if 'showdown-plus' in selected:xpi=choose_showdown_xpi(next(mod['import'] for mod in m.catalog() if mod['id']=='showdown-plus'))
        dialog('--question','--title='+title,'--text=Se respaldarán y modificarán los archivos compatibles. Tu perfil de Showdown se conserva.\n\nInstalación detectada: '+str(target)+'\n\n¿Instalar los módulos seleccionados?')
        result=progress('Instalando módulos. La compilación inicial de Calcdex puede tardar varios minutos…',lambda:m.apply(selected,xpi=xpi))
        try:create_shortcut(target);shortcut_note='Abre «Pokemon Showdown: Okayu Update» desde el menú de aplicaciones.'
        except (ModError,OSError):shortcut_note='Los módulos se instalaron, pero no se pudo crear el acceso del menú. Puedes usar «Abrir aplicación» en este gestor.'
        dialog('--info','--title='+title,'--text=Instalación completada.\n\n'+shortcut_note+'\n\nSi partiste de un AppImage, su acceso anterior sigue abriendo el original sin modificar.');return
    elif action=='Revertir modificaciones':
        dialog('--question','--title='+title,'--text=Se restaurarán los archivos respaldados solo si coinciden con la modificación registrada. ¿Revertir?');result=progress('Restaurando los archivos originales…',m.revert);remove_shortcut(target)
        message='Reversión completada. Se restauraron los archivos originales.'
    elif action=='Recuperar interrupción':result=progress('Recuperando la instalación…',m.recover);message='Recuperación completada.'
    elif action=='Abrir aplicación':
        status=m.status()
        if status['state'] in ('changed','recovery-required'):raise ModError('La instalación cambió o está pendiente de recuperación. Revisa el diagnóstico antes de abrirla.')
        launch=m.root.parents[1]/'AppRun'
        if not launch.is_file():raise ModError('No se encontró AppRun. Abre el ejecutable original de esta instalación.')
        subprocess.Popen([str(launch)],start_new_session=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);return
    else:
        destination=Path(dialog('--file-selection','--save','--confirm-overwrite','--filename=okayu-diagnostic.json','--title=Guardar diagnóstico sin datos del perfil'))
        destination.write_text(json.dumps(m.diagnostic(),indent=2)+'\n');message='Diagnóstico guardado. No incluye datos del perfil de Showdown.'
    dialog('--info','--title='+title,'--text='+message)

def main():
    parser=argparse.ArgumentParser(description='Pokemon Showdown: Okayu Update — gestor reversible de módulos para Linux')
    parser.add_argument('--version',action='version',version=VERSION)
    sub=parser.add_subparsers(dest='command')
    sub.add_parser('gui')
    sub.add_parser('xpi-discover',help='Buscar XPI de Showdown+ compatibles en Firefox, Flatpak y Snap (solo lectura)')
    sub.add_parser('discover',help='Mostrar las instalaciones y AppImages detectados')
    prepare=sub.add_parser('prepare',help='Preparar un AppImage en una ubicación fija');prepare.add_argument('image');prepare.add_argument('--data')
    for name in ['status','diagnose','plan','apply','revert','recover']:
        p=sub.add_parser(name);p.add_argument('installation');p.add_argument('--data',help='Carpeta externa de respaldos y registros')
        if name in ('plan','apply'):
            p.add_argument('--modules',default='performance,battle-messages,theme-okayu,calcdex-languages',help='IDs separados por comas; Showdown+ se importa por separado')
            p.add_argument('--xpi',help='XPI oficial de Mozilla o GitHub; omitir o usar auto para detectar Firefox');p.add_argument('--showdex-source',help='Checkout verificado de Showdex para reutilizar dependencias de desarrollo')
    args=parser.parse_args()
    try:
        if args.command in (None,'gui'):return gui()
        if args.command=='xpi-discover':
            from .xpi import discover_xpis
            spec=json.loads((Path(__file__).resolve().parents[1]/'modules/showdown-plus/addon.json').read_text())['import']
            print(json.dumps([{'path':str(c.path),'browser':c.browser,'profile':c.profile,'origin':c.origin,'version':c.version,'sha256':c.sha256} for c in discover_xpis(spec)],indent=2,ensure_ascii=False));return
        if args.command=='discover':
            print(json.dumps([{'path':str(c.path),'kind':c.kind,'version':c.version,'prepared':c.prepared} for c in discover()],indent=2,ensure_ascii=False));return
        if args.command=='prepare':
            print(json.dumps({'preparedInstallation':str(prepare_image(args.image,args.data))},indent=2));return
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
