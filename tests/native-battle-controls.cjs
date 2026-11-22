const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
module.exports=async({window,client,root,state,waitFor})=>{
 window.setSkipTaskbar(true);window.setOpacity(.01);window.showInactive();client.webContents.setBackgroundThrottling(false);window.webContents.setBackgroundThrottling(false);
 const wc=client.webContents,run=code=>wc.mainFrame.executeJavaScript(`(async()=>{${code}})()`),out=process.env.CONTROLS_EVIDENCE;fs.mkdirSync(out,{recursive:true});
 const id='battle-gen9customgame-998986',species=['Milotic','Mimikyu','Pikachu','Stantler','Riolu','Dhelmise'];
 async function mount(){
  const log=['|init|battle','|title|Controls Test vs Opponent','|gametype|doubles','|player|p1|Controls Test|1','|player|p2|Opponent|2','|teamsize|p1|6','|teamsize|p2|6','|gen|9','|tier|[Gen 9] Custom Game','|clearpoke',...['p1','p2'].flatMap(side=>species.map(name=>'|poke|'+side+'|'+name+', L50|')),'|teampreview','|start','|switch|p1a: Milotic|Milotic, L50|100/100','|switch|p1b: Mimikyu|Mimikyu, L50|100/100','|switch|p2a: Pikachu|Pikachu, L50|100/100','|switch|p2b: Stantler|Stantler, L50|100/100','|turn|1'];
  await run(`PS.connection.send=()=>{};PS.receive(${JSON.stringify('>'+id+'\n'+log.join('\n'))});PS.focusRoom('${id}');`);await waitFor(()=>run(`return !!PS.rooms['${id}']?.battle;`));await run(`const battle=PS.rooms['${id}'].battle;battle.seekTurn(Infinity);battle.nearSide.totalPokemon=4;const p=battle.nearSide.active[0];p.sprite.updateStatbar(p);`);await pause(350);
 }
 await mount();
 const teams=()=>run(`return [...document.querySelectorAll('.phd-team')].map(e=>{const r=e.getBoundingClientRect(),before=getComputedStyle(e,'::before');return {class:e.className,display:getComputedStyle(e).display,width:r.width,height:r.height,image:before.backgroundImage,slots:[...e.querySelectorAll('.phd-slot')].map(slot=>{const icon=slot.querySelector('.picon'),s=(icon||slot).getBoundingClientRect();const hit=document.elementFromPoint(s.x+s.width/2,s.y+s.height/2);return {known:!!icon,x:s.x,y:s.y,width:s.width,height:s.height,inside:s.top>=r.top-1&&s.bottom<=r.bottom+1,hit:!!icon&&(hit===icon||icon.contains(hit))};})};});`);
 const baseline=await teams();console.log('PARTY BASELINE',JSON.stringify(baseline.map(e=>({class:e.class,known:e.slots.filter(s=>s.known).length,slots:e.slots.length,inside:e.slots.filter(s=>s.inside).length}))));
 if(process.env.CONTROLS_BASELINE==='1'){fs.writeFileSync(path.join(out,'baseline.json'),JSON.stringify(baseline,null,2));return;}
 const report={teams:[],controls:[]};
 for(const mode of ['normal','theater']){
  if(mode==='theater'){await run(`__showdownProTheater.toggle('${id}');`);await pause(500);}
  const value=await teams();for(const team of value){assert.equal(team.slots.length,6,'All six known roster members are shown');assert.equal(team.slots.filter(s=>s.known).length,6);assert.ok(team.slots.every(s=>s.inside&&s.hit),'Every icon fits and remains a hover target: '+JSON.stringify(team));}report.teams.push({mode,value});
  for(const style of ['light','dark']){
   await run(`__okayuShowdownPlusPanels.setPanelTheme('${style}');`);await pause(150);
   const value=await run(`const root=document.documentElement,layer=document.querySelector('.phd-layer'),s=getComputedStyle(layer),button=document.querySelector('.pro-battle-panels-theme-toggle'),text=document.querySelector('.pro-battle-messages-toggle');return {theme:root.dataset.okayuBattlePanels,app:PS.prefs.theme,icon:button.dataset.icon,image:getComputedStyle(document.querySelector('.phd-team'),'::before').backgroundImage,banner:s.getPropertyValue('--phd-bg').trim(),label:button.getAttribute('aria-label'),adjacent:button.previousElementSibling===text,visible:getComputedStyle(button).display!=='none',box:button.getBoundingClientRect().toJSON()};`);
   assert.equal(value.theme,style);assert.equal(value.icon,style);assert.equal(value.app,'okayu');assert.ok(value.adjacent&&value.visible);assert.ok(value.label);assert.match(value.image,style==='light'?/pill\.png/:/pill_dark\.png/);assert.equal(value.banner,style==='light'?'#fff':'#1f1f1f');report.controls.push({mode,style,value});
   for(const hidden of [false,true]){
    await run(`__showdownProBattleMessages.setHidden(${hidden});`);
    const value=await run(`const b=document.querySelector('.pro-battle-messages-toggle');return {icon:b.dataset.icon,label:b.getAttribute('aria-label'),pressed:b.getAttribute('aria-pressed'),src:b.querySelector('image').getAttribute('href'),hidden:document.documentElement.classList.contains('pro-hide-battle-messages')};`);
    assert.equal(value.icon,hidden?'shiny':'unown');assert.equal(value.hidden,hidden);assert.equal(value.pressed,String(hidden));assert.ok(value.label);assert.match(value.src,hidden?/unown-shiny\.png$/:/unown\.png$/);
   }
   fs.writeFileSync(path.join(out,mode+'-'+style+'.png'),(await wc.capturePage()).toPNG());
  }
  // Real clicks use the same control state and do not dispatch a battle action.
  await run(`document.querySelector('.pro-battle-panels-theme-toggle').click();document.querySelector('.pro-battle-messages-toggle').click();`);assert.equal(await run('return __okayuShowdownPlusPanels.panelTheme;'),'light');assert.equal(await run('return __showdownProBattleMessages.hidden;'),false);
  if(mode==='theater')await run('__showdownProTheater.exit();');
 }
 const images=await run(`return await Promise.all(['solrock','lunatone','unown','unown-shiny'].map(name=>new Promise(resolve=>{const image=new Image(),timer=setTimeout(()=>resolve({name,loaded:false}),4000);image.onload=()=>{clearTimeout(timer);resolve({name,loaded:true,width:image.naturalWidth,height:image.naturalHeight});};image.onerror=()=>{clearTimeout(timer);resolve({name,loaded:false});};image.src='showdown-pro://assets/icons/controls/'+name+'.png';})));`);assert.ok(images.every(i=>i.loaded),JSON.stringify(images));report.images=images;
 await run("__okayuShowdownPlusPanels.setPanelTheme('light');__showdownProBattleMessages.setHidden(true);");
 const loaded=new Promise(resolve=>wc.once('dom-ready',resolve));wc.reload();await loaded;await waitFor(()=>state().showdexStatus==='Showdex loaded');await waitFor(()=>run('return !!window.__showdownProBattleMessages;'));await mount();assert.equal(await run('return __okayuShowdownPlusPanels.panelTheme;'),'light');assert.equal(await run('return __showdownProBattleMessages.hidden;'),true);assert.equal(await run("return document.querySelectorAll('.pro-battle-messages-toggle').length;"),1);assert.equal(await run("return document.querySelectorAll('.pro-battle-panels-theme-toggle').length;"),1);
 report.success=true;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log('BATTLE CONTROLS PASSED');
};
