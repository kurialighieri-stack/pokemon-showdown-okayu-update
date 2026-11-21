// Optional Linux surface styling. Native blur strength belongs to the compositor.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFile}=require('node:child_process');
const defaults={enabled:false,useSystem:true,opacity:.85,blur:8};
function normalize(value={}){return {enabled:value.enabled===true,useSystem:value.useSystem!==false,opacity:Number.isFinite(value.opacity)?Math.max(.05,Math.min(1,value.opacity)):.85,blur:Number.isFinite(value.blur)?Math.round(Math.max(0,Math.min(24,value.blur))):8};}
function validate(value){
 if(!value||typeof value!=='object'||Object.keys(value).some(k=>!Object.hasOwn(defaults,k))||typeof value.enabled!=='boolean'||typeof value.useSystem!=='boolean'||!Number.isFinite(value.opacity)||value.opacity<.05||value.opacity>1||!Number.isInteger(value.blur)||value.blur<0||value.blur>24)throw Error('Ajustes Glass no válidos.');
 return normalize(value);
}
function systemPreferences({home=os.homedir(),config=process.env.XDG_CONFIG_HOME||path.join(home,'.config'),desktop=process.env.XDG_CURRENT_DESKTOP||''}={}){
 const result={desktop:desktop||'Linux',available:false,opacity:.85,enabled:true,blur:'Del compositor'};
 if(!/cosmic/i.test(desktop))return result;
 const read=(file)=>{try{const stat=fs.statSync(file);return stat.size<=65536?fs.readFileSync(file,'utf8').trim():null;}catch{return null;}};
 const base=path.join(config,'cosmic'),dark=read(path.join(base,'com.system76.CosmicTheme.Mode/v1/is_dark'))!=='false';
 const folder=path.join(base,'com.system76.CosmicTheme.'+(dark?'Dark':'Light')+'/v2');
 const enabled=read(path.join(folder,'frosted_windows')),alpha=read(path.join(folder,'alpha_map')),blur=read(path.join(folder,'frosted'));
 const match=alpha?.match(/\bmedium\s*:\s*(0(?:\.\d+)?|1(?:\.0+)?)(?:\s*,|\s*\))/);
 if((enabled==='true'||enabled==='false')&&match){result.available=true;result.enabled=enabled==='true'&&blur!=='None';result.opacity=Math.max(.05,Math.min(1,Number(match[1])));result.blur=blur&&/^[A-Za-z0-9_().,\s-]{1,100}$/.test(blur)?blur:'Del compositor';}
 return result;
}
function effective(settings,system,theme){
 const inherited=settings.useSystem&&system.available;
 const active=settings.enabled&&['pro','okayu'].includes(theme)&&(!inherited||system.enabled);
 return {active,opacity:inherited?system.opacity:settings.opacity,blur:inherited?0:settings.blur,inherited};
}
let attached,settings,system,filename,css,key,watchers=[],watchTimer,backend={available:false,kind:'none',message:'Desenfoque del escritorio no disponible desde Electron. El blur ajustable es interno.'};
function load(){if(settings)return;const {app}=require('electron');filename=path.join(app.getPath('userData'),'okayu-glass.json');try{settings=normalize(JSON.parse(fs.readFileSync(filename,'utf8')));}catch{settings={...defaults};}system=systemPreferences();}
function snapshot(theme='pro'){load();return {settings:{...settings},system:{...system},effective:effective(settings,system,theme),backend:{...backend}};}
function windowOptions(){return process.platform==='linux'?{transparent:true,backgroundColor:'#00000000'}:{};}
function set(value){load();const next=validate(value);fs.mkdirSync(path.dirname(filename),{recursive:true});const temp=filename+'.tmp';fs.writeFileSync(temp,JSON.stringify(next,null,2)+'\n',{mode:0o600});fs.renameSync(temp,filename);settings=next;sync(attached?.getTheme());return snapshot(attached?.getTheme());}
function command(args){return new Promise(resolve=>execFile('xprop',args,{timeout:1500,maxBuffer:256*1024},(error,stdout)=>resolve(error?null:stdout)));}
async function probeNative(){
 const {app}=require('electron');const explicit=app.commandLine.getSwitchValue('ozone-platform');
 const x11=explicit==='x11'||(!explicit&&process.env.XDG_SESSION_TYPE==='x11');
 if(process.platform!=='linux'){backend.message='Glass se ofrece para Linux.';return;}
 if(!x11){backend={available:false,kind:'wayland',message:'Wayland: transparencia disponible; Electron no expone el protocolo de blur nativo. El control Blur interno no desenfoca el escritorio.'};return;}
 const supported=await command(['-root','_NET_SUPPORTED']);
 if(!supported?.includes('_KDE_NET_WM_BLUR_BEHIND_REGION')){backend={available:false,kind:'x11',message:'El compositor X11 no anuncia blur compatible. Se conservan transparencia y blur interno.'};return;}
 const handle=attached.window.getNativeWindowHandle();if(handle.length<4)return;
 backend={available:true,kind:'kwin-x11',id:'0x'+handle.readUInt32LE(0).toString(16),message:'Blur nativo solicitado a KWin/X11. Su intensidad se controla en el sistema; el deslizador añade blur interno.'};
}
function sync(theme='pro'){
 if(!attached)return;load();const value=effective(settings,system,theme),next=JSON.stringify(value);if(next===key)return;key=next;
 const script=`(()=>{const root=document.documentElement;if(!root)return;root.dataset.okayuGlass=${JSON.stringify(value.active?'on':'off')};root.style.setProperty('--okayu-glass-alpha',${JSON.stringify(String(value.opacity))});root.style.setProperty('--okayu-glass-blur',${JSON.stringify(value.blur+'px')});})();void 0;`;
 for(const contents of [attached.window.webContents,attached.client.webContents])if(!contents.isDestroyed())void contents.executeJavaScript(script).catch(()=>{});
 attached.window.setBackgroundColor(value.active?'#00000000':theme==='okayu'?'#211d2c':'#142838');
 attached.client.setBackgroundColor(value.active?'#00000000':'#ffffff');
 if(backend.available)void command(['-id',backend.id,...(value.active?['-f','_KDE_NET_WM_BLUR_BEHIND_REGION','32c','-set','_KDE_NET_WM_BLUR_BEHIND_REGION','0']:['-remove','_KDE_NET_WM_BLUR_BEHIND_REGION'])]);
}
async function attach(value){
 attached=value;load();css=fs.readFileSync(path.join(__dirname,'okayu-glass.css'),'utf8');
 const install=async(contents,panel=false)=>{if(contents.isDestroyed())return;try{await contents.insertCSS(css,{cssOrigin:'user'});if(panel)await contents.executeJavaScript(fs.readFileSync(path.join(__dirname,'okayu-glass-panel.js'),'utf8'));key=null;sync(attached.getTheme());}catch(error){console.error('Okayu Glass:',error.message);}};
 value.client.webContents.on('dom-ready',()=>void install(value.client.webContents));
 value.window.webContents.on('dom-ready',()=>void install(value.window.webContents,true));
 await install(value.window.webContents,true);await probeNative();key=null;sync(value.getTheme());value.publish();
 // COSMIC settings are read only. Watch only its theme directory, no polling loop.
 if(/cosmic/i.test(process.env.XDG_CURRENT_DESKTOP||'')){
  const base=path.join(process.env.XDG_CONFIG_HOME||path.join(os.homedir(),'.config'),'cosmic');
  for(const directory of ['com.system76.CosmicTheme.Mode/v1','com.system76.CosmicTheme.Dark/v2','com.system76.CosmicTheme.Light/v2'])try{
   const watcher=fs.watch(path.join(base,directory),()=>{clearTimeout(watchTimer);watchTimer=setTimeout(()=>{system=systemPreferences();key=null;sync(value.getTheme());value.publish();},200);watchTimer.unref?.();});watcher.unref();watchers.push(watcher);
  }catch{}
 }
 value.window.once('closed',()=>{for(const watcher of watchers)watcher.close();watchers=[];clearTimeout(watchTimer);attached=null;});
}
module.exports={defaults,normalize,validate,systemPreferences,effective,snapshot,windowOptions,set,sync,attach};
