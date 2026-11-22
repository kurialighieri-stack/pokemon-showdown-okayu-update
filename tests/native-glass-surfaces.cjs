// Local-only visual regression harness. Use a disposable AppDir and isolated profile.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
module.exports=async({window,client,state,waitFor,root,getMirror,openAddonWindow,browserAddons})=>{
 window.setSkipTaskbar(true);window.setOpacity(.01);window.showInactive();window.webContents.setBackgroundThrottling(false);client.webContents.setBackgroundThrottling(false);
 const wc=client.webContents,run=code=>wc.mainFrame.executeJavaScript(`(async()=>{${code}})()`),hub=code=>window.webContents.mainFrame.executeJavaScript(`(async()=>{${code}})()`);
 const out=process.env.GLASS_LOCAL_EVIDENCE;fs.mkdirSync(out,{recursive:true});
 console.log('SURFACES START');
 assert.equal(state().theme,'okayu','Fresh addon installation starts in Okayu');assert.equal(global.__initialHubTheme,'okayu','First Hub document is Okayu');
 assert.equal(await run("return document.getElementById('showdown-pro-theme').textContent;"),'','Compatibility marker contains no duplicate theme CSS');
 assert.equal(await run("return JSON.parse(localStorage.getItem('showdown_prefs')).okayuDefaultThemeVersion;"),1,'Default is a one-time migration');
 const settings={enabled:true,useSystem:false,opacity:.55,blur:0};
 const set=async patch=>{Object.assign(settings,patch);await hub(`await pro.setSetting('okayuGlass',${JSON.stringify(settings)});`);await delay(300);};
 const choose=async theme=>{await run(`PS.prefs.set('theme',${JSON.stringify(theme)});`);await waitFor(()=>state().theme===theme);await delay(350);};
 const inspect=`const alpha=value=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const c=canvas.getContext('2d');c.clearRect(0,0,1,1);c.fillStyle=value;c.fillRect(0,0,1,1);return c.getImageData(0,0,1,1).data[3]/255;};`;
 const id='battle-gen9randombattle-998981';
 console.log('SURFACES creating battle');
 const log=['|init|battle','|title|Glass Test vs Opponent','|gametype|doubles','|player|p1|Glass Test|1','|player|p2|Opponent|2','|teamsize|p1|6','|teamsize|p2|6','|gen|9','|tier|[Gen 9] Random Doubles Battle','|start','|switch|p1a: Milotic|Milotic, L81, F|100/100','|switch|p1b: Mimikyu|Mimikyu, L82, M|100/100','|switch|p2a: Ribombee|Ribombee, L85, F|100/100','|switch|p2b: Pikachu|Pikachu, L85, M|100/100','|turn|1'];
 await run(`PS.connection.send=()=>{};PS.receive(${JSON.stringify('>'+id+'\n'+log.join('\n'))});PS.focusRoom('${id}');`);
 console.log('SURFACES received battle');
 await waitFor(()=>run(`return !!PS.rooms['${id}']?.battle;`));console.log('SURFACES mounted battle');await run(`PS.rooms['${id}'].battle.seekTurn(Infinity);`);console.log('SURFACES seeked battle');
 const report={themes:{}};
 let mainView,hubVisible;
 for(const theme of ['pro','okayu']){
  await choose(theme);await set({enabled:false});
  const semantic=()=>run(`return [...document.querySelectorAll('[class*=type-],[class*=PokeHpBar-],.picon')].slice(0,30).map(e=>{const s=getComputedStyle(e);return [s.backgroundColor,s.backgroundImage,s.opacity];});`);const semanticBefore=await semantic();
  const protectedBefore=await run(`const battle=document.getElementById('room-${id}').querySelector('.battle'),s=getComputedStyle(battle);return {opacity:s.opacity,background:s.backgroundColor,filter:s.filter,icons:[...battle.querySelectorAll('img')].slice(0,4).map(i=>({opacity:getComputedStyle(i).opacity,filter:getComputedStyle(i).filter}))};`);
  await set({enabled:true});
  if(!mainView){mainView=window.contentView.children.find(view=>view.webContents===window.webContents);assert.ok(mainView,'Hub is a sibling View');const original=mainView.setVisible.bind(mainView);mainView.setVisible=value=>{hubVisible=value;original(value);};}
  await waitFor(()=>run(inspect+`return Math.abs(alpha(getComputedStyle(document.body).backgroundColor)-.55)<.01;`));
  const protectedAfter=await run(`const battle=document.getElementById('room-${id}').querySelector('.battle'),s=getComputedStyle(battle);return {opacity:s.opacity,background:s.backgroundColor,filter:s.filter,icons:[...battle.querySelectorAll('img')].slice(0,4).map(i=>({opacity:getComputedStyle(i).opacity,filter:getComputedStyle(i).filter}))};`);
  assert.deepEqual(await semantic(),semanticBefore,'Semantic badges and HP icons unchanged');
  assert.deepEqual(protectedAfter,protectedBefore,'Battle and sprites must not change');
  const hubPaint=await hub(inspect+`return ['.sidebar','.hero','.module','.addon-card','.tab-nav','button'].map(selector=>{const e=document.querySelector(selector);if(!e)return {selector,missing:true};const s=getComputedStyle(e);return {selector,alpha:alpha(s.backgroundColor),opacity:s.opacity};});`);
  assert.ok(Math.abs(hubPaint[0].alpha-.55)<.01,'Hub uses the same backing alpha');
  assert.ok(hubPaint.filter(x=>!x.missing&&x.selector!=='.sidebar').every(x=>x.alpha<=.03),'Hub cards do not accumulate opaque backgrounds: '+JSON.stringify(hubPaint));
  await run(`__showdownProTheater.toggle('${id}');await showdownProEvents.setTheaterLayout({width:420,chatShare:.45,chatCollapsed:false,calcCollapsed:false});`);
  await waitFor(()=>client.getBounds().width===window.getContentSize()[0]);await delay(800);
  assert.equal(hubVisible,false,'Hub native View hidden under the transparent theater client');



  await waitFor(()=>run(`const c=document.querySelector('[data-showdex-module=calcdex]');return !!c&&getComputedStyle(c,'::before').backgroundImage==='none';`));
  const paint=await run(inspect+`return ['.battle-log','.battle-controls','[data-showdex-module="calcdex"]','.pro-theater-chat-header','.pro-theater-calc-header'].map(selector=>{const e=document.querySelector(selector);if(!e)return {selector,missing:true};const s=getComputedStyle(e),p=getComputedStyle(e,'::before');return {selector,alpha:alpha(s.backgroundColor),image:s.backgroundImage,pseudo:p.backgroundImage,pseudoContent:p.content,marker:e.dataset.okayuGlassSurface,opacity:s.opacity};});`);
  assert.ok(paint.filter(x=>!x.missing).every(x=>x.alpha<=.03&&x.image==='none'&&x.pseudo==='none'),'Theater and Calcdex surfaces are uniformly transparent: '+JSON.stringify(paint));
  assert.equal(await run(`return document.querySelectorAll('#room-${id} .battle [data-okayu-glass-surface]').length;`),0,'No battlefield elements marked');
  fs.writeFileSync(path.join(out,theme+'-theater.png'),(await wc.capturePage()).toPNG());
  // Streamer must still receive the Hub even though it is hidden behind theater.
  for(const [key,value] of Object.entries({streamerShowHub:true,streamerShowShowdex:true,streamerShowMoves:true,streamerShowPokemonTooltips:true,streamerShowTeras:true,streamerEnabled:true}))await hub(`await pro.setSetting('${key}',${value});`);
  const mirror=getMirror();mirror.window.setOpacity(.01);mirror.window.showInactive();mirror.window.webContents.setBackgroundThrottling(false);
  await waitFor(()=>!!mirror.lastFrame?.hub&&mirror.stats.painted>0);assert.equal(mirror.lastFrame.hub.displayWidth,360);
  const hubPixels=mirror.lastFrame.hub.pixels;assert.ok(new Set(Array.from({length:100},(_,i)=>hubPixels.readUInt32LE(Math.floor(i*(hubPixels.length/4-1)/100)*4))).size>5,'Hidden Hub capture still contains the Hub');
  await hub("await pro.setSetting('streamerEnabled',false);");
  await run('__showdownProTheater.exit();');await delay(400);assert.equal(hubVisible,true);
  await delay(1000);const idleBefore=await run('return window.__okayuGlassStats.runs;');await delay(1000);const idleAfter=await run('return window.__okayuGlassStats.runs;');
  report.themes[theme]={idleScans:idleAfter-idleBefore,hub:hubPaint,theater:paint,protectedUnchanged:true,stats:await run('return window.__okayuGlassStats;')};console.log('SURFACES THEME PASS',theme,JSON.stringify(report.themes[theme]));
 }
 // Verify actual local blur with an opaque image-like checker behind an in-app menu.
 await run(`const image=document.createElement('div');image.id='glass-checker';image.setAttribute('role','img');image.style='position:fixed;left:40px;top:80px;width:400px;height:220px;z-index:99990;background:repeating-linear-gradient(90deg,#000 0 4px,#fff 4px 8px)';const menu=document.createElement('div');menu.id='glass-test-menu';menu.className='ps-popup';menu.style='position:fixed;left:60px;top:100px;width:240px;height:160px;z-index:99991;background:#352c43;border:1px solid #725c8c';menu.textContent='Menu text remains sharp';document.body.append(image,menu);`);
 await set({blur:0});await waitFor(()=>run(inspect+`return Math.abs(alpha(getComputedStyle(document.getElementById('glass-test-menu')).backgroundColor)-.55)<.01&&getComputedStyle(document.getElementById('glass-test-menu')).backgroundImage==='none';`));await delay(300);fs.writeFileSync(path.join(out,'menu-clear.png'),(await wc.capturePage()).toPNG());console.log('MENU RECT',JSON.stringify(await run(`const m=document.getElementById('glass-test-menu'),r=m.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,filter:getComputedStyle(m).backdropFilter,bg:getComputedStyle(m).background};`)));
 const {bitmapFrame}=require(path.join(root,'app/streamer-mode.cjs'));
 async function contrast(){const viewport=await run('return {width:innerWidth,height:innerHeight};'),part=bitmapFrame(await wc.capturePage()),values=[];for(let x=100;x<250;x++){const offset=(Math.floor(220*part.height/viewport.height)*part.width+Math.floor(x*part.width/viewport.width))*4;values.push(part.pixels[offset]);}const avg=values.reduce((a,b)=>a+b,0)/values.length;return Math.sqrt(values.reduce((sum,n)=>sum+(n-avg)**2,0)/values.length);}
 const clear=await contrast();await set({blur:16});await delay(400);const blurred=await contrast();
 assert.ok(clear>30&&blurred<clear*.4,'Menu blur changes actual underlying pixels: '+JSON.stringify({clear,blurred}));
 assert.equal(await run("return getComputedStyle(document.getElementById('glass-test-menu')).opacity;"),'1');
 fs.writeFileSync(path.join(out,'menu-blur.png'),(await wc.capturePage()).toPNG());report.blur={clear,blurred};
 await run("document.getElementById('glass-test-menu').remove();document.getElementById('glass-checker').remove();PS.join('options');");await waitFor(()=>run('return !!document.querySelector("select[name=theme]");'));await delay(300);
 fs.writeFileSync(path.join(out,'options.png'),(await wc.capturePage()).toPNG());await run("PS.leave('options');");
 if(openAddonWindow&&browserAddons.active.has('enhancedTooltips')){
  const {BrowserWindow}=require('electron'),before=new Set(BrowserWindow.getAllWindows());await openAddonWindow(browserAddons.optionsUrl('enhancedTooltips'));const popup=BrowserWindow.getAllWindows().find(w=>!before.has(w));assert.ok(popup);popup.setOpacity(.01);popup.showInactive();popup.webContents.setBackgroundThrottling(false);await delay(500);
  const bodyAlpha=await popup.webContents.executeJavaScript(`(()=>{${inspect}return alpha(getComputedStyle(document.body).backgroundColor);})()`);assert.ok(Math.abs(bodyAlpha-.55)<.01,'Native companion window follows same alpha');fs.writeFileSync(path.join(out,'companion.png'),(await popup.webContents.capturePage()).toPNG());popup.close();report.companion=true;
 }
 await set({enabled:false});await delay(200);report.success=true;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log('SURFACES ALL PASSED',JSON.stringify(report.blur));
};
