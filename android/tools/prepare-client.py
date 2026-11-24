#!/usr/bin/env python3
"""Package a locally built pinned upstream client; no server or Electron runtime."""
import argparse,hashlib,json,re,shutil,concurrent.futures,urllib.request,subprocess,zipfile
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--source',type=Path,required=True);p.add_argument('--pro',type=Path,required=True);a=p.parse_args()
root=Path(__file__).resolve().parents[2];out=root/'android/app/src/main/assets/client';web=a.source/'play.pokemonshowdown.com';archive=a.pro/'build/upstream/pokemon-showdown-client-source.zip'
expected='22977619245aecc47dd1f656754eed68c957509292205c6c25aec35e89aaea1f'
if hashlib.sha256(archive.read_bytes()).hexdigest()!=expected:raise SystemExit('Unrecognized client source archive')
with zipfile.ZipFile(archive) as z:
 for name in z.namelist():
  if name.startswith('play.pokemonshowdown.com/src/') and name.endswith(('.ts','.tsx','.js')):
   if (a.source/name).read_bytes()!=z.read(name):raise SystemExit('Client source modified: '+name)
if out.exists():shutil.rmtree(out)
out.mkdir(parents=True)
lock=json.loads((root/'android/client-data.lock.json').read_text())
cache=root/'android/build/data-cache'

for name in ['js','style','src','fx','sprites']:
 shutil.copytree(web/name,out/name,dirs_exist_ok=True,ignore_dangling_symlinks=True)
(out/'config').mkdir(exist_ok=True)
for f in (web/'config').iterdir():
 if f.is_file():shutil.copy2(f.resolve(),out/'config'/f.name)
for f in web.rglob('*'):
 if f.is_symlink() and f.is_file() and f.relative_to(web).parts[0] in ['js','style','src','fx','sprites']:
  dest=out/f.relative_to(web);dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(f.resolve(),dest)
# Upstream local/test-client path keeps local teams and official login endpoint.
config=out/'config/config.js';config.write_text(config.read_text()+"\nConfig.testclient=true;Config.server=Config.defaultserver;\n")
html=(web/'index-new.html').read_text();html=html.replace('<meta charset="UTF-8" />','<meta charset="UTF-8" /><base href="/" />')
# Fixed root URLs are served by the native asset loader, not by a remote page.
extras=out/'okayu';extras.mkdir(exist_ok=True)
for name in ['layout.js','battle-layout.js','battle-layout.css','combat-skin.css','ui-surfaces.css','backgrounds.js','move-effectiveness.js','battle-presentation.js','themes.js','narration.js','themes.js','options.js','move-info.js','team-panel.js']:
 shutil.copy2(root/'android/app/src/main/assets/android'/name,extras/name)
for module in ['battle-messages','showdown-plus']:
 base=root/'modules'/module/'files/app'
 for f in base.rglob('*'):
  if f.is_file() and (f.suffix in ['.png','.css'] or f.name in ['battle-messages.js','showdown-plus-panels.js']):
   dest=extras/f.relative_to(base);dest.parent.mkdir(parents=True,exist_ok=True)
   if f.suffix=='.js':dest.write_text(f.read_text().replace('showdown-pro://assets/','/okayu/assets/'))
   else:shutil.copy2(f,dest)
# Only visible modules are loaded; no Electron scripts/Glass/streamer.
html=html.replace('</head>','<link rel="stylesheet" href="/okayu/battle-messages.css"><link rel="stylesheet" href="/okayu/battle-layout.css"></head>')
html=html.replace('</body>',''.join('<script defer src="/okayu/'+f+'"></script>' for f in ['bridge.js','layout.js','battle-messages.js','narration.js','themes.js','options.js','move-info.js','team-panel.js','battle-presentation.js','backgrounds.js','move-effectiveness.js','battle-layout.js'])+'</body>')
# Pure browser bridge/theme adapters remain upstream implementations.
for filename,source in [('client-bridge.js',a.pro/'app/client-bridge.js'),('client-theme.js',root/'modules/theme-okayu/files/app/client-theme.js')]:
 shutil.copy2(source,extras/filename)
# Android-only theme choices share the Pro layout and replace its palette.
theme=extras/'client-theme.js';code=theme.read_text()
code=code.replace("const okayu = ps.prefs.theme === 'okayu';", "const okayu = ['okayu','gura','raora','cecilia','amelia','baelz'].includes(ps.prefs.theme);")
code=code.replace("['pro','okayu'].includes(ps.prefs.theme)", "['pro','okayu','gura','raora','cecilia','amelia','baelz'].includes(ps.prefs.theme)")
code=code.replace("node.props.children = children;", "node.props.children = children.filter(child=>child?.props?.value!=='pro'); for(const [value,label] of [['gura','Gura'],['raora','Raora'],['cecilia','Ceci'],['amelia','Amelia'],['baelz','Bae']]) if(!node.props.children.some(c=>c?.props?.value===value)) node.props.children.push(preact.h('option',{value},label));")
theme.write_text(code)
css=subprocess.check_output(['node','-e',"const p=require(process.argv[1]);process.stdout.write(p.tokenize(require(process.argv[2]))+'\\n'+p.css)",str(root/'modules/theme-okayu/files/app/theme-palette.cjs'),str(a.pro/'app/client-theme-css.cjs')]).decode()
(extras/'theme.css').write_text(css)
html=html.replace('</head>','<link rel="stylesheet" href="/okayu/theme.css"><link rel="stylesheet" href="/okayu/combat-skin.css"><link rel="stylesheet" href="/okayu/ui-surfaces.css"></head>')
seed="<script>try{let p=JSON.parse(localStorage.getItem('showdown_prefs')||'{}');if(!p.okayuDefaultThemeVersion){p.theme='okayu';p.okayuDefaultThemeVersion=1;localStorage.setItem('showdown_prefs',JSON.stringify(p));}}catch{}document.documentElement.classList.add('showdown-pro','showdown-okayu','dark','showdown-new-client');</script>"
html=html.replace('<body>', '<body>'+seed)
html=html.replace('<script defer src="/okayu/bridge.js"></script>','<script defer src="/okayu/bridge.js"></script><script defer src="/okayu/client-bridge.js"></script><script defer src="/okayu/client-theme.js"></script>')
showdex=a.pro/'build/okayu-update-showdex'
if not showdex.is_dir():showdex=a.pro/'build/showdex'
if showdex.is_dir():
 shutil.copytree(showdex,out/'showdex',dirs_exist_ok=True)
 bundle=out/'showdex/main.js';text=bundle.read_text();text=text.replace('STANDALONE_RESOURCE_PROTOCOL:"showdown-pro"','STANDALONE_RESOURCE_PROTOCOL:"https"').replace('STANDALONE_RESOURCE_PREFIX:"showdex"','STANDALONE_RESOURCE_PREFIX:"appassets.androidplatform.net/showdex"');theme_case='case"okayu":case"pro":return"dark"'
 if text.count(theme_case)!=1:raise RuntimeError('Showdex theme adapter no longer matches')
 text=text.replace(theme_case,'case"okayu":case"gura":case"raora":case"cecilia":case"amelia":case"baelz":return"light";case"pro":return"dark"')
 bundle.write_text(text)
 html=html.replace('<script defer src="/okayu/battle-layout.js"></script>','<script defer src="/showdex/main.js"></script><script defer src="/okayu/battle-layout.js"></script>')
plus=a.pro/'vendor/browser-addons/showdownPlus'
if plus.is_dir():
 shutil.copytree(plus,out/'plus',dirs_exist_ok=True)
 background_lock=json.loads((root/'android/backgrounds.lock.json').read_text())
 for name,expected_hash in background_lock['files'].items():
  asset=out/'plus/bg'/name
  if not asset.is_file() or hashlib.sha256(asset.read_bytes()).hexdigest()!=expected_hash:raise RuntimeError('Showdown+ background missing or incompatible: '+name)
 # Reuse Showdown+'s anchor path so animation offsets, FX and tooltips agree.
 page=out/'plus/page.js';text=page.read_text();old='return anchored(anchor, place);'
 if text.count(old)!=1:raise RuntimeError('Showdown+ anchor adapter no longer matches')
 page.write_text(text.replace(old,'return anchored(window.okayuBattlePerspective?.anchor(scene, sp, anchor) || anchor, place);'))
 api="""const changes=[],messages=[];const stored=()=>JSON.parse(localStorage.getItem('okayu.plus')||'{}');const browser={storage:{local:{get:async keys=>{const all=stored();if(keys==null)return all;if(typeof keys==='string')return {[keys]:all[keys]};return Object.fromEntries((Array.isArray(keys)?keys:Object.keys(keys)).map(k=>[k,all[k]??keys[k]]));},set:async values=>{const all=stored(),change={};for(const [k,v] of Object.entries(values)){change[k]={oldValue:all[k],newValue:v};all[k]=v;}localStorage.setItem('okayu.plus',JSON.stringify(all));changes.forEach(f=>f(change,'local'));}},onChanged:{addListener:f=>changes.push(f)}},runtime:{getURL:file=>new URL('/plus/'+file.replace(/^\\//,''),location.origin).href,onMessage:{addListener:f=>messages.push(f)},sendMessage:async message=>{for(const f of messages){const result=f(message,{});if(result!==undefined)return await result;}}}};const chrome={runtime:browser.runtime};"""
 code='(()=>{'+api+'\n'+'\n'.join((plus/name).read_text() for name in ['config.js','patch.js','background-electron.js','css-assets.js','loader.js'])+'\n})();'
 (extras/'plus-loader.js').write_text(code)
 html=html.replace('<script defer src="/okayu/battle-layout.js"></script>','<script defer src="/okayu/plus-loader.js"></script><script defer src="/okayu/showdown-plus-panels.js"></script><script defer src="/okayu/battle-layout.js"></script>')
 html=html.replace('</head>','<link rel="stylesheet" href="/okayu/showdown-plus.css"></head>')
 node="const fs=require('fs'),p=process.argv[1],c=require(p+'/config-node.cjs'),list=c.phdParseList(fs.readFileSync(p+'/sprites.txt','utf8')),out={};for(const name of new Set([...Object.keys(list.folders),...Object.keys(list.aliases)]))for(const dir of ['ani','ani-back','ani-shiny','ani-back-shiny']){const url=c.phdRedirectUrl(list,dir,name);if(url)out['/sprites/'+dir+'/'+name+'.gif']=url;}process.stdout.write(JSON.stringify(out));"
 (out/'plus/redirects.json').write_bytes(subprocess.check_output(['node','-e',node,str(plus)]))
(out/'index.html').write_text(html)
(out/'okayu/bridge.js').write_text('''(()=>{let serial=0;const pending=new Map();window.okayuBridge={request(method,value){return new Promise((resolve,reject)=>{const id=String(++serial),timer=setTimeout(()=>{pending.delete(id);reject(Error('Native request timed out'));},30000);pending.set(id,{resolve,reject,timer});okayuNative.postMessage(JSON.stringify({id,method,value}));});}};window.showdownProEvents={receive(){},sent(){},themeStyleReady:()=>Promise.resolve(true)};okayuNative.onmessage=e=>{const r=JSON.parse(e.data),p=pending.get(r.id);if(!p)return;clearTimeout(p.timer);pending.delete(r.id);r.error?p.reject(Error(r.error)):p.resolve(r.value);};window.open=(url)=>{const target=new URL(url,location.href);if(target.protocol==='https:')okayuBridge.request('external.open',target.href).catch(console.error);return null;};if(window.PSLoginServer)PSLoginServer.rawQuery=(act,data)=>okayuBridge.request('login.query',{...data,act});})();''')
# Data scripts missing from the source release are captured once and hashed.
urls=set(re.findall(r'(?:src|href)="(/data/[^"?]+)',html));urls.update(['/data/graphics.js','/data/text/en.js'])
def fetch(url):
 dest=out/url.lstrip('/');dest.parent.mkdir(parents=True,exist_ok=True)
 cached=cache/url.lstrip('/')
 if cached.is_file():shutil.copy2(cached,dest)
 if not dest.exists():
  print('Fetching',url,flush=True)
  with urllib.request.urlopen(urllib.request.Request('https://play.pokemonshowdown.com'+url,headers={'User-Agent':'Mozilla/5.0'}),timeout=60) as response:dest.write_bytes(response.read())
 if url not in lock or hashlib.sha256(dest.read_bytes()).hexdigest()!=lock[url]:raise RuntimeError('Data hash mismatch: '+url)
 if not cached.exists():cached.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(dest,cached)
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:list(pool.map(fetch,sorted(urls)))
notices=out/'notices';notices.mkdir();shutil.copy2(root/'LICENSE',notices/'LICENSE');shutil.copy2(root/'AI_DISCLOSURE.md',notices/'AI_DISCLOSURE.md');shutil.copy2(root/'THIRD_PARTY_NOTICES.md',notices/'THIRD_PARTY_NOTICES.md');shutil.copy2(root/'android/FAN_PROJECT_NOTICE.md',notices/'FAN_PROJECT_NOTICE.md')
files={str(f.relative_to(out)):hashlib.sha256(f.read_bytes()).hexdigest() for f in out.rglob('*') if f.is_file() and f.name!='provenance.json'}
(out/'provenance.json').write_text(json.dumps({'upstreamCommit':'f7dac498bb00b920227a32502267d7de358ae965','license':'AGPL-3.0','phase':'prototype','excluded':['glass','streamer'],'files':files},indent=2)+'\n')
print('Packaged',len(files),'files')
