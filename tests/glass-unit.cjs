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
 const win={webContents:contents,setBackgroundColor:color=>colors.push(color),getNativeWindowHandle:()=>Buffer.from([0x23,0x01,0,0]),once:(_event,callback)=>closed=callback};
 const client={webContents:contents,setBackgroundColor:color=>colors.push(color)};
 process.env.XDG_CURRENT_DESKTOP='KDE';
 const file=require.resolve('../modules/glass/files/app/okayu-glass.cjs');delete require.cache[file];
 Module._load=function(name,...rest){
  if(name==='electron')return {app:{getPath:()=>root,commandLine:{getSwitchValue:()=> 'x11'}}};
  if(name==='node:child_process')return {execFile:(_binary,args,_options,callback)=>{commands.push(args);callback(null,args[0]==='-root'?'_NET_SUPPORTED = _KDE_NET_WM_BLUR_BEHIND_REGION':'');}};
  return originalLoad.call(this,name,...rest);
 };
 try{
  const native=require(file);await native.attach({window:win,client,getTheme:()=> 'pro',publish(){}});
  native.set({enabled:true,useSystem:false,opacity:.5,blur:12});
  assert.ok(colors.includes('#00000000'));assert.equal(native.snapshot().backend.available,true);
  assert.ok(commands.some(args=>args[0]==='-id'&&args[1]==='0x123'&&args.includes('-set')),'Only the native handle from this window is targeted');
  native.set({enabled:false,useSystem:false,opacity:.5,blur:12});assert.ok(commands.at(-1).includes('-remove'));closed();
 }finally{Module._load=originalLoad;if(oldDesktop===undefined)delete process.env.XDG_CURRENT_DESKTOP;else process.env.XDG_CURRENT_DESKTOP=oldDesktop;fs.rmSync(root,{recursive:true,force:true});delete require.cache[file];}
});
