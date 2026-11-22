const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const glass=require('../modules/glass/files/app/okayu-glass.cjs');
test('settings fail closed and bound the blur cost',()=>{
 for(const value of [{},{enabled:true,useSystem:false,opacity:NaN,blur:8},{enabled:true,useSystem:false,opacity:.8,blur:25},{enabled:true,useSystem:false,opacity:.8,blur:8,command:'bad'}])assert.throws(()=>glass.validate(value));
 assert.deepEqual(glass.normalize({opacity:-10,blur:Infinity}),{enabled:false,useSystem:true,opacity:.05,blur:8});
});
test('only Pro and Okayu activate, with explicit manual and system fallbacks',()=>{
 const settings={enabled:true,useSystem:false,opacity:.6,blur:12},system={available:true,enabled:false,opacity:.3};
 assert.equal(glass.effective(settings,system,'pro').active,true);assert.equal(glass.effective(settings,system,'okayu').blur,12);assert.equal(glass.effective(settings,system,'light').active,false);
 settings.useSystem=true;assert.equal(glass.effective(settings,system,'pro').active,false);system.enabled=true;
 assert.deepEqual(glass.effective(settings,system,'okayu'),{active:true,inherited:true,opacity:.3,blur:0});
 system.available=false;assert.equal(glass.effective(settings,system,'pro').blur,12);
});
test('COSMIC preferences are read-only, validate alpha, follow light/dark, and do not invent GNOME settings',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'okayu-glass-test-'));
 try{
  const base=path.join(root,'cosmic'),mode=path.join(base,'com.system76.CosmicTheme.Mode/v1');fs.mkdirSync(mode,{recursive:true});fs.writeFileSync(path.join(mode,'is_dark'),'true');
  const dark=path.join(base,'com.system76.CosmicTheme.Dark/v2');fs.mkdirSync(dark,{recursive:true});
  const files={'frosted_windows':'true','alpha_map':'(medium: 0.34154,)','frosted':'Medium'};
  for(const [name,text] of Object.entries(files))fs.writeFileSync(path.join(dark,name),text);
  const config={config:root,desktop:'COSMIC'};const prefs=glass.systemPreferences(config);assert.equal(prefs.available,true);assert.equal(prefs.opacity,.34154);assert.equal(prefs.blur,'Medium');
  for(const [name,text] of Object.entries(files))assert.equal(fs.readFileSync(path.join(dark,name),'utf8'),text);
  fs.writeFileSync(path.join(dark,'alpha_map'),'(medium: 99,)');assert.equal(glass.systemPreferences(config).available,false);
  assert.equal(glass.systemPreferences({config:root,desktop:'ubuntu:GNOME'}).available,false);
  fs.writeFileSync(path.join(mode,'is_dark'),'false');assert.equal(glass.systemPreferences(config).available,false,'Missing Light preference is not borrowed from Dark');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('native attach uses the View background API and scopes X11 blur requests to its own window',async()=>{
 const Module=require('node:module'),originalLoad=Module._load,commands=[],colors=[],root=fs.mkdtempSync(path.join(os.tmpdir(),'okayu-native-glass-')),oldDesktop=process.env.XDG_CURRENT_DESKTOP;
 const contents={isDestroyed:()=>false,executeJavaScript:async()=>{},insertCSS:async()=>{},on(){}};
 let closed;
 const win={contentView:{addChildView(){}},getContentSize:()=>[1200,800],on(){},webContents:contents,setBackgroundColor:color=>colors.push(color),getNativeWindowHandle:()=>Buffer.from([0x23,0x01,0,0]),once:(_event,callback)=>closed=callback};
 const client={setBounds(){},setVisible(){},webContents:contents,setBackgroundColor:color=>colors.push(color)};
 process.env.XDG_CURRENT_DESKTOP='KDE';
 const file=require.resolve('../modules/glass/files/app/okayu-glass.cjs');delete require.cache[file];
 Module._load=function(name,...rest){
  if(name==='electron')return {app:{getPath:()=>root,commandLine:{getSwitchValue:()=> 'x11'}},BaseWindow:function(){return win;},WebContentsView:function(){return client;},BrowserWindow:function(){return win;}};
  if(name==='node:child_process')return {execFile:(_binary,args,_options,callback)=>{commands.push(args);callback(null,args[0]==='-root'?'_NET_SUPPORTED = _KDE_NET_WM_BLUR_BEHIND_REGION':'');}};
  return originalLoad.call(this,name,...rest);
 };
 try{
  const native=require(file);native.set({enabled:true,useSystem:false,opacity:.5,blur:12});native.createWindow({webPreferences:{}});await native.attach({window:win,client,getTheme:()=> 'pro',publish(){}});
  native.set({enabled:true,useSystem:false,opacity:.5,blur:12});
  assert.ok(colors.includes('#00000000'));assert.equal(native.snapshot().backend.available,true);
  assert.ok(commands.some(args=>args[0]==='-id'&&args[1]==='0x123'&&args.includes('-set')),'Only the native handle from this window is targeted');
  native.set({enabled:false,useSystem:false,opacity:.5,blur:12});assert.ok(commands.at(-1).includes('-remove'));closed();
 }finally{Module._load=originalLoad;if(oldDesktop===undefined)delete process.env.XDG_CURRENT_DESKTOP;else process.env.XDG_CURRENT_DESKTOP=oldDesktop;fs.rmSync(root,{recursive:true,force:true});delete require.cache[file];}
});
test('attaching an unloaded client never waits for its first navigation',async()=>{
 const Module=require('node:module'),originalLoad=Module._load,root=fs.mkdtempSync(path.join(os.tmpdir(),'okayu-unloaded-glass-'));let clientEvaluations=0,hubEvaluations=0;
 const hub={getURL:()=> 'showdown-pro://app/index.html',isDestroyed:()=>false,isLoadingMainFrame:()=>true,on(){},once(){},insertCSS:async()=>{},mainFrame:{executeJavaScript:async()=>{hubEvaluations++;}}};
 const unloaded={getURL:()=>'',isDestroyed:()=>false,isLoadingMainFrame:()=>false,on(){},once(){},executeJavaScript:()=>{clientEvaluations++;return new Promise(()=>{});}};
 const file=require.resolve('../modules/glass/files/app/okayu-glass.cjs');delete require.cache[file];
 Module._load=function(name,...rest){if(name==='electron')return {app:{getPath:()=>root,commandLine:{getSwitchValue:()=> 'wayland'}}};return originalLoad.call(this,name,...rest);};
 let timer;
 try{const current=require(file);await Promise.race([current.attach({window:{webContents:hub,setBackgroundColor(){},once(){}},client:{webContents:unloaded,setBackgroundColor(){}},getTheme:()=> 'pro',publish(){}}),new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('Attach blocked the navigation')),500))]);assert.equal(clientEvaluations,0);assert.ok(hubEvaluations>0,'A painted Hub is initialized even while Electron reports loading');}
 finally{clearTimeout(timer);Module._load=originalLoad;fs.rmSync(root,{recursive:true,force:true});delete require.cache[file];}
});

test('disabled Glass constructs exactly the original opaque BrowserWindow and enabling requires a restart',()=>{
 const Module=require('node:module'),originalLoad=Module._load,root=fs.mkdtempSync(path.join(os.tmpdir(),'okayu-opaque-glass-')),calls=[];
 const file=require.resolve('../modules/glass/files/app/okayu-glass.cjs');delete require.cache[file];
 Module._load=function(name,...rest){if(name==='electron')return {app:{getPath:()=>root},BrowserWindow:function(options){calls.push(options);},BaseWindow:function(){throw Error('Transparent renderer created while disabled');}};return originalLoad.call(this,name,...rest);};
 try{const g=require(file),options={title:'Original',webPreferences:{sandbox:true}};g.createWindow(options);assert.equal(calls[0],options);assert.deepEqual(g.windowOptions(),{});assert.equal(g.snapshot().restartRequired,false);g.set({enabled:true,useSystem:false,opacity:.5,blur:0});assert.equal(g.snapshot().restartRequired,true);}
 finally{Module._load=originalLoad;delete require.cache[file];fs.rmSync(root,{recursive:true,force:true});}
});

test('fixed Glass stylesheet performs no traversal, style measurement or event-driven repaint',()=>{
 const vm=require('node:vm'),source=fs.readFileSync(path.join(__dirname,'../modules/glass/files/app/okayu-glass-renderer.js'),'utf8');
 const root={dataset:{},style:{setProperty(){}}},context={window:{},document:{documentElement:root,createTreeWalker(){throw Error('DOM traversal');}},getComputedStyle(){throw Error('Style measurement');},MutationObserver:function(){throw Error('Observer');}};
 vm.runInNewContext(source,context);const api=context.window.__okayuGlassSurfaces;
 const a=api.collect({active:true,theme:'pro',role:'client',opacity:.5,blur:0}),b=api.collect({active:true,theme:'okayu',role:'client',opacity:.7,blur:20});assert.equal(a.css,b.css);assert.ok(a.css.length<6000);assert.equal(a.runs,0);assert.match(a.css,/@layer okayu-glass/);assert.equal(api.collect({active:false}).css,'');
});
test('Okayu is selected once on addon installation and later theme choices survive',async()=>{
 const vm=require('node:vm'),source=fs.readFileSync(path.join(__dirname,'../modules/theme-okayu/files/app/client-preload.cjs'),'utf8');let prefs={theme:'pro',showdownProThemeVersion:1};
 async function launch(){const inserts=[],bridge={},classes=new Set(),element={classList:{contains:k=>classes.has(k),toggle:(k,v)=>v?classes.add(k):classes.delete(k),add:k=>classes.add(k)},dataset:{},style:{setProperty(){}}};const context={Promise,JSON,location:{origin:'https://play.pokemonshowdown.com',pathname:'/newclient'},document:{documentElement:element,body:element,querySelector:()=>null},localStorage:{getItem:()=>JSON.stringify(prefs),setItem:(_k,v)=>prefs=JSON.parse(v)},matchMedia:()=>({matches:false}),MutationObserver:function(){this.observe=()=>{};this.disconnect=()=>{};},Event:function(){},require:()=>({contextBridge:{exposeInMainWorld:(name,value)=>bridge[name]=value},ipcRenderer:{on(){},send(){},invoke:async key=>key==='client:theme-css'?'theme-css':null},webFrame:{insertCSS:(css,options)=>inserts.push([css,options.cssOrigin])}})};context.CSSStyleSheet=function(){this.cssRules=[{selectorText:'.test',style:{cssText:'color:red;'}}];this.replaceSync=()=>{};};context.window=context;context.top=context;context.addEventListener=()=>{};context.dispatchEvent=()=>{};vm.runInNewContext(source,context);assert.equal(await bridge.showdownProEvents.themeStyleReady(),true);assert.deepEqual(inserts,[['.test{color:red;}','author']]);return classes;}
 assert.ok((await launch()).has('showdown-okayu'));assert.equal(prefs.okayuDefaultThemeVersion,1);prefs.theme='dark';assert.equal((await launch()).has('showdown-okayu'),false);assert.equal(prefs.theme,'dark');
});
test('initial Hub theme defaults to Okayu and remembers the last validated theme',()=>{
 const vm=require('node:vm'),directory=fs.mkdtempSync(path.join(os.tmpdir(),'okayu-theme-cache-')),file=path.join(__dirname,'../modules/theme-okayu/files/app/okayu-theme-cache.cjs'),source=fs.readFileSync(file,'utf8');
 const load=()=>{const context={module:{exports:{}},require:name=>name==='electron'?{app:{getPath:()=>directory}}:require(name)};vm.runInNewContext(source,context);return context.module.exports;};
 try{let cache=load();assert.equal(cache.read(),'okayu');cache.remember('dark');cache=load();assert.equal(cache.read(),'dark');cache.remember('invalid');assert.equal(load().read(),'dark');}finally{fs.rmSync(directory,{recursive:true,force:true});}
});
test('startup skips preloaded styles and restores both priorities only if preload failed',async()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../modules/core/addon.json'),'utf8'));
 const source=manifest.edits.find(e=>e.path==='app/client-startup.cjs'&&e.replace.includes('const early=')).replace;
 const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
 for(const ready of [true,false]){const inserted=[],run=new AsyncFunction('themeCSS','contents','execute','require',source);await run('BASE\nEXTRA',{insertCSS:async(css,options)=>inserted.push([css,options.cssOrigin])},async()=>ready,()=>()=> 'FALLBACK');assert.deepEqual(inserted,ready?[]:[['FALLBACK','user'],['FALLBACK','author']]);}
 assert.ok(!source.includes('style.textContent = ${JSON.stringify(themeCSS)}'));
});
test('origin partition preserves shorthand resets, quoted semicolons and custom-property blocks',async()=>{
 const m=JSON.parse(fs.readFileSync(path.join(__dirname,'../modules/core/addon.json'),'utf8')),source=m.edits.find(e=>e.path==='app/client-preload.cjs'&&e.replace.includes('function split(rules)')).replace;
 const normal='font:italic 14px/1.2 Arial;content:"a; !important";--tokens:{x:"a;b";y:calc(1px + 2px)};background-image:url("data:image/svg+xml;a;b");',important='color:red !important;';
 class Sheet{constructor(){this.cssRules=[{selectorText:'.fixture',style:{cssText:normal+important}}];}replaceSync(){}}
 const inserted=[],AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
 assert.equal(await new AsyncFunction('ipcRenderer','webFrame','CSSStyleSheet','let themeStyleReady;'+source+';return await themeStyleReady;')({invoke:async()=>'.fixture{}'},{insertCSS:(css,options)=>inserted.push([css,options.cssOrigin])},Sheet),true);
 assert.deepEqual(inserted,[['.fixture{'+normal+'}','author'],['.fixture{'+important+'}','user']]);
 const theme=fs.readFileSync(path.join(__dirname,'../modules/theme-okayu/files/app/client-preload.cjs'),'utf8');assert.ok(theme.includes(source),'Both sandboxed preloads use the same installer');
});
test('zero menu blur disables filtering and floating surfaces share the theme tint',()=>{
 const vm=require('node:vm'),source=fs.readFileSync(path.join(__dirname,'../modules/glass/files/app/okayu-glass-renderer.js'),'utf8'),values=new Map(),context={window:{},document:{documentElement:{dataset:{},style:{setProperty:(k,v)=>values.set(k,v)}}}};vm.runInNewContext(source,context);
 const api=context.window.__okayuGlassSurfaces;api.collect({active:true,role:'client',theme:'okayu',opacity:.55,blur:0});assert.equal(values.get('--okayu-glass-backdrop'),'none');assert.equal(values.get('--okayu-glass-base'),'53,44,67');api.collect({active:true,role:'client',theme:'pro',opacity:.55,blur:12});assert.equal(values.get('--okayu-glass-backdrop'),'blur(12px)');assert.equal(values.get('--okayu-glass-base'),'20,40,56');
});
test('Showdown+ links its original stylesheet once at the extension URL',()=>{
 const vm=require('node:vm'),source=fs.readFileSync(path.join(__dirname,'../modules/showdown-plus/files/vendor/browser-addons/showdownPlus/css-assets.js'),'utf8'),links=[];
 const context={chrome:{runtime:{getURL:file=>'chrome-extension://fixture/'+file}},document:{documentElement:{dataset:{},style:{setProperty(){}}},head:{append:e=>links.push(e)},getElementById:id=>links.find(e=>e.id===id),createElement:()=>({})},MutationObserver:function(){throw Error('No observer should run when the document root already exists');}};
 vm.runInNewContext(source,context);vm.runInNewContext(source,context);assert.equal(links.length,1);assert.equal(links[0].rel,'stylesheet');assert.equal(links[0].href,'chrome-extension://fixture/ui/panels.css');
});
test('battle controls persist independent panel colors and normal/shiny text states',()=>{
 const vm=require('node:vm'),source=fs.readFileSync(path.join(__dirname,'../modules/battle-messages/files/app/battle-messages.js'),'utf8'),saved=new Map();
 function element(){const attrs={};return {dataset:{},attrs,classList:{add(){}},setAttribute:(k,v)=>attrs[k]=v,append(child){this.child=child;},replaceChildren(child){this.child=child;}};}
 function boot(){const text=element(),panels=element(),root={dataset:{},classList:{toggle(k,v){this[k]=v;}}},listeners={};const context={document:{documentElement:root,body:{classList:{contains:()=>true}},createElementNS:element,querySelectorAll:s=>s==='.pro-battle-messages-toggle'?[text]:[panels]},localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},Dex:{text:{getLanguage:()=> 'es'}},PS:{prefs:{subscribe(){}}},addEventListener:(k,f)=>(listeners[k]??=[]).push(f)};context.window=context;vm.runInNewContext(source,context);vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../modules/showdown-plus/files/app/showdown-plus-panels.js'),'utf8'),context);const api=context.__showdownProBattleMessages;api.setPanelTheme=context.__okayuShowdownPlusPanels.setPanelTheme;Object.defineProperty(api,'panelTheme',{get:()=>context.__okayuShowdownPlusPanels.panelTheme});return {api,text,panels,root,listeners};}
 let app=boot();assert.equal(app.api.panelTheme,'dark');assert.equal(app.panels.dataset.icon,'dark');assert.equal(app.text.dataset.icon,'unown');assert.equal(app.text.child.child.attrs.href,'showdown-pro://assets/icons/controls/unown.png');
 app.api.setHidden(true);assert.equal(app.text.dataset.icon,'shiny');assert.equal(app.text.attrs['aria-pressed'],'true');assert.match(app.text.child.child.attrs.href,/unown-shiny.png$/);app.api.setPanelTheme('light');assert.equal(app.panels.dataset.icon,'light');assert.equal(app.root.dataset.okayuBattlePanels,'light');assert.match(app.panels.attrs['aria-label'],/oscuros/);
 app=boot();assert.equal(app.api.hidden,true);assert.equal(app.api.panelTheme,'light');app.api.setPanelTheme('invalid');assert.equal(app.api.panelTheme,'light');app.listeners.storage.forEach(f=>f({key:'okayuShowdownPlusPanelTheme',newValue:'dark'}));assert.equal(app.panels.dataset.icon,'dark');app.listeners.storage.forEach(f=>f({key:'showdownProBattleMessagesHidden',newValue:'false'}));assert.equal(app.text.dataset.icon,'unown');
});
