const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
module.exports=async({window,client,root,state,waitFor})=>{
 window.setSkipTaskbar(true);window.setOpacity(.01);window.showInactive();window.webContents.setBackgroundThrottling(false);client.webContents.setBackgroundThrottling(false);
 const wc=client.webContents,run=code=>wc.mainFrame.executeJavaScript(`(async()=>{${code}})()`),hub=code=>window.webContents.mainFrame.executeJavaScript(`(async()=>{${code}})()`),out=process.env.ALPHA_EVIDENCE;fs.mkdirSync(out,{recursive:true});
 const {bitmapFrame}=require(path.join(root,'app/streamer-mode.cjs')),id='battle-gen9randombattle-998985';
 const log=['|init|battle','|title|Alpha Test vs Opponent','|gametype|doubles','|player|p1|Alpha Test|1','|player|p2|Opponent|2','|teamsize|p1|6','|teamsize|p2|6','|gen|9','|tier|[Gen 9] Random Doubles Battle','|start','|switch|p1a: Milotic|Milotic, L81, F|100/100','|switch|p1b: Mimikyu|Mimikyu, L82, M|100/100','|switch|p2a: Ribombee|Ribombee, L85, F|100/100','|switch|p2b: Pikachu|Pikachu, L85, M|100/100','|turn|1'];
 await run(`PS.connection.send=()=>{};PS.receive(${JSON.stringify('>'+id+'\n'+log.join('\n'))});PS.focusRoom('${id}');`);await waitFor(()=>run(`return !!PS.rooms['${id}']?.battle;`));await run(`PS.rooms['${id}'].battle.seekTurn(Infinity);`);
 async function capture(contents){let last;for(let i=0;i<6;i++){try{const image=await contents.capturePage({stayHidden:true,stayAwake:true});if(!image.isEmpty())return image;last=Error('Empty capture');}catch(error){if(!/VizSentEmptyBitmap|empty/i.test(error.message))throw error;last=error;}await pause(100);}throw last;}
 async function measure(contents,execute,selectors){
  const geometry=await execute(`return {width:innerWidth,height:innerHeight,rootAlpha:document.documentElement.style.getPropertyValue('--okayu-glass-alpha'),body:getComputedStyle(document.body).backgroundColor,rects:${JSON.stringify(selectors)}.map(selector=>{const e=document.querySelector(selector);if(!e)return {selector,missing:true};const r=e.getBoundingClientRect();return {selector,x:r.x,y:r.y,width:r.width,height:r.height,backdrop:getComputedStyle(e).backdropFilter};})};`);
  const f=bitmapFrame(await capture(contents));return geometry.rects.map(r=>{
   if(r.missing||r.width<20||r.height<20)return {...r,missing:true};const values=[];
   for(let iy=1;iy<16;iy++)for(let ix=1;ix<16;ix++){const x=Math.round((r.x+8+(r.width-16)*ix/16)*f.width/geometry.width),y=Math.round((r.y+8+(r.height-16)*iy/16)*f.height/geometry.height);if(x>=0&&y>=0&&x<f.width&&y<f.height)values.push(f.pixels[(y*f.width+x)*4+3]);}
   values.sort((a,b)=>a-b);return {...r,rootAlpha:geometry.rootAlpha,body:geometry.body,alpha:values[Math.floor(values.length*.1)]};
  });
 }
 const report={alpha:[],pills:[]};
 for(const theme of ['pro','okayu']){
  await run(`PS.prefs.set('theme','${theme}');`);await waitFor(()=>state().theme===theme);
  for(const mode of ['normal','theater']){
   if(mode==='theater'){await run(`__showdownProTheater.toggle('${id}');`);await waitFor(()=>client.getBounds().width===window.getContentSize()[0]);await pause(500);}
   for(const opacity of [.2,.55,.86,1]){
    await hub(`await pro.setSetting('okayuGlass',{enabled:true,useSystem:false,opacity:${opacity},blur:0});`);await waitFor(()=>run(`return document.documentElement.style.getPropertyValue('--okayu-glass-alpha')==='${opacity}';`));await run('await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));');await pause(250);fs.writeFileSync(path.join(out,theme+'-'+mode+'-'+opacity+'.png'),(await capture(wc)).toPNG());
    const panels=await measure(wc,run,[`#room-${id} .battle-log`,`#room-${id} .battle-controls`,'[data-showdex-module="calcdex"]']);const sidebar=await measure(window.webContents,hub,['.sidebar']);
    for(const panel of [...panels,...sidebar].filter(p=>!p.missing)){assert.ok(Math.abs(panel.alpha-opacity*255)<=2,'A single backing alpha: '+JSON.stringify({theme,mode,opacity,panel}));if(panel.selector.includes('battle-log'))assert.equal(panel.backdrop,'none');}
    report.alpha.push({theme,mode,opacity,panels,sidebar});console.log('ALPHA UNIFORM',theme,mode,opacity);
   }
   fs.writeFileSync(path.join(out,theme+'-'+mode+'.png'),(await capture(wc)).toPNG());if(mode==='theater')await run('__showdownProTheater.exit();');
  }
 }
 for(const theme of ['light','okayu']){
  await run(`PS.prefs.set('theme','${theme}');`);await waitFor(()=>state().theme===theme);
  const states=[];for(const enabled of [false,true]){
   await hub(`await pro.setSetting('okayuGlass',{enabled:${enabled},useSystem:false,opacity:.55,blur:0});`);await pause(200);
   const teams=await run(`return [...document.querySelectorAll('.phd-team')].map(e=>{const s=getComputedStyle(e,'::before'),r=e.getBoundingClientRect();return {class:e.className,image:s.backgroundImage,content:s.content,opacity:s.opacity,width:r.width,height:r.height,icons:e.querySelectorAll('.picon').length};});`);
   assert.equal(teams.length,2);for(const team of teams){assert.match(team.image,/chrome-extension:\/\/[^/]+\/ui\/assets\/pill(?:_dark)?\.png/);assert.ok(team.icons>=2);assert.ok(team.width>0&&team.height>0);}
   states.push(teams);
  }
  assert.deepEqual(states[0],states[1],'Glass cannot alter the combat party pills');
  const loaded=await run(`return await Promise.all([...document.querySelectorAll('.phd-team')].map(e=>{const value=getComputedStyle(e,'::before').backgroundImage;const url=value.slice(value.indexOf('"')+1,value.lastIndexOf('"'));return new Promise(resolve=>{const image=new Image(),timer=setTimeout(()=>resolve({url,loaded:false,timeout:true}),4000);image.onload=()=>{clearTimeout(timer);resolve({url,loaded:true,width:image.naturalWidth,height:image.naturalHeight});};image.onerror=()=>{clearTimeout(timer);resolve({url,loaded:false});};image.src=url;});}));`);
  assert.ok(loaded.every(image=>image.loaded&&image.width===588&&image.height===128),JSON.stringify(loaded));assert.equal(await run("return document.querySelectorAll('#okayu-showdown-plus-panels').length;"),1,'One canonical extension stylesheet');report.pills.push({theme,states,loaded});fs.writeFileSync(path.join(out,'pills-'+theme+'.png'),(await capture(wc)).toPNG());
 }
 report.tooltips=[];
 for(const theme of ['pro','okayu']){
  await run(`PS.prefs.set('theme','${theme}');`);await waitFor(()=>state().theme===theme);
  for(const blur of [0,12]){
   await hub(`await pro.setSetting('okayuGlass',{enabled:true,useSystem:false,opacity:.55,blur:${blur}});`);await pause(250);
   await run(`const room=PS.rooms['${id}'],tips=room.tooltips||new BattleTooltips(room.battle);tips.placeTooltip(tips.showPokemonTooltip(room.battle.nearSide.pokemon[0]));`);await waitFor(()=>run(`const e=document.querySelector('#tooltipwrapper .tooltip');return !!e&&e.getBoundingClientRect().width>0;`));await pause(150);
   const tooltip=await run(`const e=document.querySelector('#tooltipwrapper .tooltip'),s=getComputedStyle(e);return {background:s.backgroundColor,opacity:s.opacity,backdrop:s.backdropFilter,text:e.textContent.slice(0,120)};`);
   assert.equal(tooltip.background,theme==='pro'?'rgba(20, 40, 56, 0.55)':'rgba(53, 44, 67, 0.55)');assert.equal(tooltip.opacity,'1');assert.equal(tooltip.backdrop,blur?'blur(12px)':'none');report.tooltips.push({theme,blur,...tooltip});fs.writeFileSync(path.join(out,'tooltip-'+theme+'-'+blur+'.png'),(await capture(wc)).toPNG());await run('BattleTooltips.hideTooltip();');await pause(200);
  }
 }
 report.success=true;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log('ALPHA AND PILLS PASSED');
};
