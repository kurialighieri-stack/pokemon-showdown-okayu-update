"""Versioned, reversible file transactions for Pokemon Showdown: Okayu Update."""
from __future__ import annotations
import hashlib,json,os,shutil,subprocess,tempfile,time,uuid,zipfile,stat,functools
from pathlib import Path,PurePosixPath
from .platforms import WINDOWS,data_directory,file_lock,windows_processes,long_path,native_path,build_directory

VERSION='0.1.0-alpha.4'
ROOT=Path(__file__).resolve().parents[1]
class ModError(Exception):pass

def digest(data):return hashlib.sha256(data).hexdigest() if data is not None else None
def load(path):return json.loads(Path(path).read_text(encoding='utf-8'))
def safe(root,name):
    p=PurePosixPath(name)
    if not name or p.is_absolute() or '\\' in name or ':' in name or any(x in ('..','.') for x in name.split('/')):raise ModError('Ruta de módulo inválida: '+name)
    if WINDOWS:
        reserved={'CON','PRN','AUX','NUL','CONIN$','CONOUT$',*(f'COM{i}' for i in range(1,10)),*(f'LPT{i}' for i in range(1,10))}
        if any(part.rstrip(' .')!=part or part.split('.')[0].upper() in reserved for part in p.parts):raise ModError('Ruta de Windows inválida: '+name)
    target=root.joinpath(*p.parts)
    for item in [target,*target.parents]:
        if item==root.parent:break
        reparse=WINDOWS and item.exists() and bool(getattr(item.lstat(),'st_file_attributes',0)&0x400)
        if item.is_symlink() or reparse:raise ModError('No se modifican enlaces simbólicos: '+name)
    return target

def read(root,name):
    p=safe(root,name)
    if p.exists() and not p.is_file():raise ModError('Se esperaba un archivo: '+name)
    return p.read_bytes() if p.exists() else None

def atomic(path,data):
    path.parent.mkdir(parents=True,exist_ok=True)
    fd,tmp=tempfile.mkstemp(prefix='.okayu-',dir=path.parent)
    try:
        with os.fdopen(fd,'wb') as f:f.write(data);f.flush();os.fsync(f.fileno())
        if path.exists():os.chmod(tmp,stat.S_IMODE(path.stat().st_mode))
        os.replace(tmp,path)
    finally:
        if os.path.exists(tmp):os.unlink(tmp)

def unpack(archive,destination):
    destination=long_path(destination)
    with zipfile.ZipFile(archive) as z:
        if len(z.infolist())>50000 or sum(i.file_size for i in z.infolist())>1024**3:raise ModError('Paquete demasiado grande')
        for info in z.infolist():
            if info.is_dir():continue
            if stat.S_ISLNK(info.external_attr>>16):raise ModError('El paquete contiene enlaces')
            target=safe(destination,info.filename);target.parent.mkdir(parents=True,exist_ok=True)
            with z.open(info) as src,target.open('wb') as dst:shutil.copyfileobj(src,dst)

def app_root(path):
    path=long_path(path)
    if any(part.startswith('.mount_') for part in path.parts):raise ModError('Esa carpeta es un montaje temporal. Selecciona el archivo AppImage para preparar una instalación fija.')
    if (path/'resources/app/package.json').is_file():return path/'resources/app'
    if (path/'package.json').is_file() and (path/'app/main.cjs').is_file():return path
    raise ModError('Elige una instalación extraída que contenga resources/app/package.json')

def require_closed(root):
    install=root.parents[1]
    if WINDOWS:
        for executable in windows_processes():
            if long_path(executable).is_relative_to(install):raise ModError('Cierra esta instalación de Showdown antes de modificarla.')
        return
    if not Path('/proc').exists():return
    for proc in Path('/proc').iterdir():
        if not proc.name.isdigit() or int(proc.name)==os.getpid():continue
        try:
            executable=(proc/'exe').resolve()
            if long_path(executable).is_relative_to(install):raise ModError('Cierra esta instalación de Showdown antes de modificarla.')
        except (PermissionError,FileNotFoundError,ProcessLookupError):continue

def exclusive(method):
    @functools.wraps(method)
    def wrapper(self,*args,**kwargs):
        if getattr(self,'_owns_lock',False):return method(self,*args,**kwargs)
        self.directory.mkdir(parents=True,exist_ok=True)
        try:
            with file_lock(self.directory/'.lock'):
                self._owns_lock=True
                try:return method(self,*args,**kwargs)
                finally:self._owns_lock=False
        except BlockingIOError:raise ModError('Otra operación de Okayu Update está en curso para esta instalación')
    return wrapper

class Manager:
    def __init__(self,path,state=None,repository=ROOT):
        self.root=app_root(path);self.repository=long_path(repository)
        self.data=long_path(state or data_directory())
        if self.data.resolve().is_relative_to(self.root.parents[1]):raise ModError('Los respaldos deben guardarse fuera de la instalación de la aplicación')
        self.identity=hashlib.sha256(str(self.root).encode()).hexdigest()[:20]
        self.directory=self.data/'installations'/self.identity
        self.receipt=self.directory/'active.json'
        self.journal=self.directory/'pending.json'
        self.version=load(self.root/'package.json')['version']
    def catalog(self):
        result=[]
        for key in load(self.repository/'modules/index.json'):
            m=load(self.repository/'modules'/key/'addon.json')
            if m['id']!=key:raise ModError('Identificador de módulo inválido')
            if not (WINDOWS and key=='glass'):result.append(m)
        return sorted(result,key=lambda m:m['order'])
    def compatibility_path(self):
        suffix='-windows' if WINDOWS else ''
        return self.repository/'compatibility'/f'{self.version}{suffix}.json'
    def compatibility(self):
        p=self.compatibility_path()
        if not p.is_file():raise ModError(f'Versión {self.version} aún no compatible. No se modificó ningún archivo. Adjunta el diagnóstico a GitHub.')
        return load(p)
    def status(self):
        r=load(self.receipt) if self.receipt.exists() else None
        conflicts=[name for name,entry in (r or {}).get('files',{}).items() if digest(read(self.root,name))!=entry['after']]
        return {'managerVersion':VERSION,'appVersion':self.version,'compatible':self.compatibility_path().is_file(),'installedModules':(r or {}).get('modules',[]),'state':'recovery-required' if self.journal.exists() else 'changed' if conflicts else 'installed' if r else 'clean','changedFiles':conflicts}
    def _baseline(self,compat):
        if self.journal.exists():raise ModError('Hay una transacción pendiente. Ejecuta recover antes de continuar.')
        previous=load(self.receipt) if self.receipt.exists() else None
        active=previous and previous['appVersion']==self.version and not self.status()['changedFiles']
        # A new release must match its own pristine fingerprints. Never restore old code onto it.
        def baseline(name):
            if active and name in previous['files']:
                entry=previous['files'][name]
                if entry['before'] is None:return None
                data=(self.directory/'transactions'/previous['id']/'backup'/name).read_bytes()
                if digest(data)!=entry['before']:raise ModError('Respaldo alterado: '+name)
                return data
            return read(self.root,name)
        for name,expected in compat['files'].items():
            if digest(baseline(name))!=expected:raise ModError('Archivo original no reconocido: '+name+'. La versión o el contenido cambió; no se aplicaron parches.')
        return previous,active,baseline
    def prepare(self,selected,xpi=None,showdex_source=None,build=True):
        compat=self.compatibility();previous,active,baseline=self._baseline(compat)
        selected=set(selected)|{'core'};catalog=self.catalog();known={m['id'] for m in catalog}
        if selected-known:raise ModError('Módulos desconocidos: '+', '.join(selected-known))
        modules=[m for m in catalog if m['id'] in selected];files={};imports={}
        def current(name):return files[name] if name in files else baseline(name)
        # Remove the previous set virtually, then compose the requested modules once.
        if previous:
            for name,entry in previous['files'].items():
                if active:files[name]=baseline(name)
                elif entry['before'] is None:
                    if digest(read(self.root,name)) not in (None,entry['after']):raise ModError('Archivo de módulo editado: '+name)
                    files[name]=None
        for module in modules:
            directory=self.repository/'modules'/module['id']
            if self.version not in module['appVersions']:raise ModError('Módulo incompatible: '+module['id'])
            if 'import' in module:
                from .xpi import discover_xpis,validate_xpi
                package=xpi
                if not package or package=='auto':
                    found=discover_xpis(module['import'])
                    if not found:raise ModError('No se encontró un XPI compatible de Showdown+ en Firefox. Descarga el XPI oficial desde GitHub Releases v1.4 o Mozilla y selecciónalo manualmente.')
                    package=found[0].path
                with tempfile.TemporaryDirectory(prefix='okayu-xpi-') as tmp:
                    # Firefox may update an extension while the manager is open.
                    # Verify our private snapshot, then extract that same snapshot.
                    tmp=Path(tmp);snapshot=tmp/'package.xpi';shutil.copyfile(package,snapshot)
                    verified=validate_xpi(snapshot,module['import']);imports[module['id']]={'origin':verified.origin,'sha256':verified.sha256,'version':verified.version}
                    content=tmp/'content';unpack(snapshot,content)
                    prefix=module['import']['destination']
                    for p in content.rglob('*'):
                        if p.is_file() and not p.relative_to(content).parts[0].startswith('META-INF'):files[prefix+'/'+p.relative_to(content).as_posix()]=p.read_bytes()
                for patch in module.get('importEdits',[]):
                    name=prefix+'/'+patch['path'];data=files[name]
                    if digest(data)!=patch['before']:raise ModError('Contenido de XPI inesperado: '+patch['path'])
                    text=data.decode()
                    for change in reversed(patch['changes']):text=text[:change['start']]+change['text']+text[change['end']:]
                    files[name]=text.encode()
                if module.get('generateConfigNode'):
                    files[prefix+'/config-node.cjs']=files[prefix+'/config.js']+b'\nmodule.exports = {phdParseList, phdRedirectUrl};\n'
            payloads={**module['files'],**module.get('platformFiles',{}).get('windows' if WINDOWS else 'linux',{})}
            for name,expected in payloads.items():
                p=safe(directory/'files',name);data=p.read_bytes()
                if digest(data)!=expected:raise ModError('El paquete local fue alterado: '+module['id']+'/'+name)
                if baseline(name) is not None and name not in compat['files'] and not (previous and name in previous['files']):raise ModError('Colisión con archivo ajeno: '+name)
                files[name]=data
            for patch in [*module['edits'],*module.get('platformEdits',{}).get('windows' if WINDOWS else 'linux',[])]:
                data=current(patch['path'])
                if data is None:raise ModError('Falta archivo: '+patch['path'])
                text=data.decode().replace('\r\n','\n');count=text.count(patch['find'])
                if count!=1:raise ModError(f"Ancla incompatible en {module['id']}/{patch['path']}: {count} coincidencias")
                files[patch['path']]=text.replace(patch['find'],patch['replace']).encode()
        scripts=[];styles=[]
        for m in modules:
            scripts.extend(current(name).decode() for name in m.get('clientScripts',[]))
            styles.extend(current(name).decode() for name in m.get('styles',[]))
        files['app/okayu-update-client.js']=('\n'.join(scripts)+'\ntrue;\n').encode()
        files['app/okayu-update.css']=('\n'.join(styles)+'\n').encode()
        rebuild=any(m.get('rebuildShowdex') for m in modules)
        if rebuild:
            name='app/main.cjs';text=current(name).decode()
            text=text.replace("addonUpdates?.installed('showdex',path.join(root,'build/showdex'))||path.join(root,'build/showdex')","path.join(root,'build/okayu-update-showdex')")
            text=text.replace("addonUpdates.installed('showdex',path.join(root,'build/showdex'))","path.join(root,'build/okayu-update-showdex')")
            files[name]=text.encode()
            if build:self._build_showdex(files,showdex_source,compat)
        files['app/okayu-update-installed.json']=(json.dumps({'version':VERSION,'appVersion':self.version,'modules':[m['id'] for m in modules],'imports':imports},indent=2)+'\n').encode()
        files={name:data for name,data in files.items() if data!=read(self.root,name)}
        # Unmanaged files must not be overwritten, including generated/imported paths.
        owned=(previous or {}).get('files',{})
        for name in files:
            if name not in compat['files'] and name not in owned and read(self.root,name) is not None:raise ModError('Archivo existente no administrado: '+name)
        return {'modules':[m['id'] for m in modules],'files':files,'baseline':baseline,'rebuildShowdex':rebuild,'previous':previous,'activePrevious':active}
    def _build_showdex(self,files,provided,compat):
        self.data.mkdir(parents=True,exist_ok=True)
        with file_lock(self.data/'.build.lock'),build_directory(self.data) as workspace:
            return self._compile_showdex(files,provided,compat,workspace)
    def _compile_showdex(self,files,provided,compat,workspace):
        archive=self.root/'build/upstream/showdex-source.zip'
        if not archive.is_file():raise ModError('Falta el código fuente de Showdex incluido con Pro')
        node=self.root/('build/update-runtime/node.exe' if WINDOWS else 'build/update-runtime/node')
        if not node.exists():raise ModError('Esta versión requiere el runtime Node incluido en la distribución Linux de Pro')
        env={**os.environ,'ELECTRON_RUN_AS_NODE':'1','CI':'true','PATH':native_path(node.parent)+os.pathsep+os.environ.get('PATH','')}
        self.directory.mkdir(parents=True,exist_ok=True)
        cache_key=('win-hoisted-'+digest(archive.read_bytes())[:16]) if WINDOWS else digest(archive.read_bytes())
        source=Path(provided).resolve() if provided else workspace/'build-cache'/cache_key/'source'
        if not (source/'package.json').is_file():source.mkdir(parents=True,exist_ok=True);unpack(archive,source)
        if load(source/'package.json')['version']!=compat['showdexVersion']:raise ModError('Versión de Showdex inesperada')
        ready=source/'.okayu-dependencies-ready'
        if not (source/'node_modules/webpack').exists() or (not provided and not ready.exists()):
            print('Instalando dependencias de Showdex (primera compilación)…',flush=True)
            dependency_log=self.directory/'last-dependencies.log'
            with dependency_log.open('w') as output:
                options=['--config.node-linker=hoisted','--config.package-import-method=copy'] if WINDOWS else []
                try:subprocess.run([native_path(node),native_path(self.root/'node_modules/pnpm/bin/pnpm.cjs'),'install','--frozen-lockfile','--ignore-scripts',*options],cwd=native_path(source),env=env,stdout=output,stderr=subprocess.STDOUT,check=True)
                except subprocess.CalledProcessError:raise ModError('No se pudieron preparar las dependencias de Calcdex. Consulta last-dependencies.log; la instalación sigue intacta.')
            ready.write_text('ready\n',encoding='utf-8')
        build_parent=workspace/'installations'/self.identity;build_parent.mkdir(parents=True,exist_ok=True)
        with tempfile.TemporaryDirectory(prefix='okayu-build-',dir=build_parent) as tmp:
            stage=Path(tmp)/'app';shutil.copytree(self.root,stage,ignore=shutil.ignore_patterns('test-results','okayu-update-showdex'),copy_function=shutil.copy2)
            for name,data in files.items():
                p=safe(stage,name)
                if data is None:
                    if p.exists():p.unlink()
                else:p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
            output=Path(tmp)/'compiled';log=self.directory/'last-build.log'
            print('Compilando Calcdex con los módulos seleccionados…',flush=True)
            with log.open('w') as f:
                try:subprocess.run([native_path(node),native_path(stage/'scripts/build-showdex.mjs'),'--source',native_path(source),'--output',native_path(output)],cwd=native_path(stage),env=env,stdout=f,stderr=subprocess.STDOUT,check=True)
                except subprocess.CalledProcessError:raise ModError('Falló la compilación. El archivo last-build.log contiene el detalle; la instalación sigue intacta.')
            if not (output/'main.js').is_file():raise ModError('Compilación incompleta')
            for p in output.rglob('*'):
                if p.is_file():files['build/okayu-update-showdex/'+p.relative_to(output).as_posix()]=p.read_bytes()
    def _commit(self,changes,mode,modules,baseline=None,previous=None,fail_after=None):
        require_closed(self.root)
        if self.journal.exists():raise ModError('Recupera la transacción pendiente antes de continuar')
        transaction=uuid.uuid4().hex;folder=self.directory/'transactions'/transaction;folder.mkdir(parents=True)
        original={name:read(self.root,name) for name in changes}
        before_receipt=self.receipt.read_bytes() if self.receipt.exists() else None
        journal={'id':transaction,'mode':mode,'files':{name:digest(data) for name,data in original.items()},'after':{name:digest(data) for name,data in changes.items()},'receipt':before_receipt.decode() if before_receipt else None}
        for name,data in original.items():
            if data is not None:p=safe(folder/'rollback',name);p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
        entries={}
        if mode=='apply':
            for name,data in changes.items():
                before=baseline(name)
                # Previously created files are not part of the original app after an update.
                if previous and name in previous['files'] and previous['files'][name]['before'] is None:before=None
                if before is not None:p=safe(folder/'backup',name);p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(before)
                entries[name]={'before':digest(before),'after':digest(data)}
            # Preserve managed paths whose bytes did not change when selecting the same set.
            if previous:
                for name,entry in previous['files'].items():
                    if name not in entries and digest(read(self.root,name))==entry['after'] and entry['before']!=entry['after']:
                        entries[name]=entry
                        if entry['before'] is not None:
                            data=(self.directory/'transactions'/previous['id']/'backup'/name).read_bytes();p=safe(folder/'backup',name);p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
        atomic(self.journal,(json.dumps(journal,indent=2)+'\n').encode())
        try:
            for i,(name,data) in enumerate(changes.items()):
                if digest(read(self.root,name))!=digest(original[name]):raise ModError('La instalación cambió durante la operación: '+name)
                p=safe(self.root,name)
                if data is None:
                    if p.exists():p.unlink()
                else:atomic(p,data)
                if fail_after is not None and i==fail_after:raise ModError('Fallo simulado de escritura')
            if mode=='apply':atomic(self.receipt,(json.dumps({'id':transaction,'managerVersion':VERSION,'appVersion':self.version,'modules':modules,'files':entries},indent=2)+'\n').encode())
            elif self.receipt.exists():self.receipt.unlink()
            self.journal.unlink()
        except BaseException:
            self.recover();raise
        return {'operation':mode,'modules':modules,'changedFiles':len(changes),'transaction':transaction}
    @exclusive
    def apply(self,selected,xpi=None,showdex_source=None,fail_after=None):
        require_closed(self.root)
        plan=self.prepare(selected,xpi,showdex_source)
        # Verify original bytes again immediately before the transaction.
        self._baseline(self.compatibility())
        return self._commit(plan['files'],'apply',plan['modules'],plan['baseline'],plan['previous'],fail_after)
    @exclusive
    def revert(self):
        require_closed(self.root)
        if not self.receipt.exists():raise ModError('No hay una instalación de Okayu Update registrada aquí')
        receipt=load(self.receipt)
        if receipt['appVersion']!=self.version:raise ModError('La app se actualizó. No se restaurarán archivos de otra versión.')
        if self.status()['changedFiles']:raise ModError('Hay archivos cambiados desde la instalación. Reversión cancelada para conservarlos.')
        changes={}
        for name,entry in receipt['files'].items():
            data=None if entry['before'] is None else (self.directory/'transactions'/receipt['id']/'backup'/name).read_bytes()
            if digest(data)!=entry['before']:raise ModError('Respaldo inválido: '+name)
            changes[name]=data
        return self._commit(changes,'revert',[])
    @exclusive
    def recover(self):
        require_closed(self.root)
        if not self.journal.exists():raise ModError('No hay una transacción pendiente')
        j=load(self.journal);folder=self.directory/'transactions'/j['id']/'rollback'
        data={}
        for name,expected in j['files'].items():
            current=digest(read(self.root,name))
            if current not in (expected,j['after'][name]):raise ModError('Recuperación detenida: un archivo cambió externamente: '+name)
            data[name]=None if expected is None else safe(folder,name).read_bytes()
            if digest(data[name])!=expected:raise ModError('Respaldo de recuperación inválido')
        for name,value in data.items():
            p=safe(self.root,name)
            if value is None:
                if p.exists():p.unlink()
            else:atomic(p,value)
        if j['receipt'] is None:
            if self.receipt.exists():self.receipt.unlink()
        else:atomic(self.receipt,j['receipt'].encode())
        self.journal.unlink();return {'operation':'recover','restoredFiles':len(data)}
    def diagnostic(self):
        s=self.status();compat=self.compatibility() if s['compatible'] else {'files':{}}
        s['fingerprints']={name:digest(read(self.root,name)) for name in compat['files']}
        s['platform']='windows' if WINDOWS else 'linux';s['profileDataIncluded']=False
        return s
