const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
module.exports=async({window,client,state,waitFor,root})=>{
 window.setSkipTaskbar(true);window.setOpacity(.01);window.showInactive();window.webContents.setBackgroundThrottling(false);client.webContents.setBackgroundThrottling(false);
 const wc=client.webContents,run=code=>wc.mainFrame.executeJavaScript(`(async()=>{${code}})()`),hub=code=>window.webContents.mainFrame.executeJavaScript(`(async()=>{${code}})()`);
 assert.equal(await run('return await showdownProEvents.themeStyleReady();'),true,'Early partitioned CSS installed, not compatibility fallback');
 const css=require(path.join(root,'app/client-theme-bundle.cjs'))();
 const original=process.env.LAYOUT_ORIGINAL_APP;
 const referenceCSS=original?[require(path.join(original,'app/client-theme-css.cjs')),fs.readFileSync(path.join(root,'app/theater-mode.css'),'utf8'),fs.readFileSync(path.join(original,'app/client-replays.css'),'utf8'),fs.readFileSync(path.join(root,'app/okayu-update.css'),'utf8')].join('\n'):css;
 const out=process.env.LAYOUT_EVIDENCE;fs.mkdirSync(out,{recursive:true});const report={};
 const snapshot=async selectors=>run(`return ${JSON.stringify(selectors)}.flatMap(selector=>[...document.querySelectorAll(selector)].slice(0,18).map((e,index)=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {selector,index,display:s.display,position:s.position,float:s.cssFloat,direction:s.flexDirection,gap:s.gap,padding:s.padding,margin:s.margin,font:s.font,lineHeight:s.lineHeight,align:s.alignItems,width:+r.width.toFixed(1),height:+r.height.toFixed(1),x:+r.x.toFixed(1),y:+r.y.toFixed(1)};}));`);
 async function compare(name,selectors){
  await delay(350);const fixed=await snapshot(selectors);
  const handles=[await wc.insertCSS(referenceCSS,{cssOrigin:'user'}),await wc.insertCSS(referenceCSS,{cssOrigin:'author'})];await delay(150);const reference=await snapshot(selectors);
  for(const handle of handles)await wc.removeInsertedCSS(handle);
  const differences=fixed.map((v,i)=>JSON.stringify(v)!==JSON.stringify(reference[i])?{fixed:v,reference:reference[i]}:null).filter(Boolean);
  report[name]={elements:fixed.length,differences};fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify({fixed,reference,differences},null,2));assert.equal(differences.length,0,name+' matches original author/user geometry: '+JSON.stringify(differences.slice(0,4)));fs.writeFileSync(path.join(out,name+'.png'),(await wc.capturePage()).toPNG());console.log('LAYOUT PASS',name,fixed.length);
 }
 const id='battle-gen9randombattle-998983',log=['|init|battle','|title|Layout Test vs Opponent','|gametype|doubles','|player|p1|Layout Test|1','|player|p2|Opponent|2','|teamsize|p1|6','|teamsize|p2|6','|gen|9','|tier|[Gen 9] Random Doubles Battle','|start','|switch|p1a: Milotic|Milotic, L81, F|100/100','|switch|p1b: Mimikyu|Mimikyu, L82, M|100/100','|switch|p2a: Ribombee|Ribombee, L85, F|100/100','|switch|p2b: Pikachu|Pikachu, L85, M|100/100','|turn|1'];
 await run(`PS.connection.send=()=>{};PS.receive(${JSON.stringify('>'+id+'\n'+log.join('\n'))});PS.focusRoom('${id}');`);await waitFor(()=>run(`return !!PS.rooms['${id}']?.battle;`));await run(`PS.rooms['${id}'].battle.seekTurn(Infinity);`);
 for(const theme of ['pro','okayu']){
  await run(`PS.prefs.set('theme','${theme}');`);await waitFor(()=>state().theme===theme);
  for(const glass of [false,true]){
   await hub(`await pro.setSetting('okayuGlass',{enabled:${glass},useSystem:false,opacity:.55,blur:0});`);
   const prefix=theme+'-'+(glass?'glass':'opaque');
   await compare(prefix+'-normal',['.header button','.header .fa','.tabbar a','.battle-options button','.battle-controls button']);
   await run(`__showdownProReplays.show(false);const list=document.querySelector('.pro-replays-results');list.innerHTML='';for(let i=0;i<3;i++){const a=document.createElement('a');a.className='blocklink pro-replay-result';a.href='#';a.innerHTML='<small>[Gen 9] Random Battle</small><strong>Player '+i+' vs Opponent</strong><small>21/11/2026</small>';list.append(a);}`);
   assert.equal(await run("return getComputedStyle(document.querySelector('.pro-replay-result')).display;"),'flex');
   await compare(prefix+'-replays',['dialog.pro-replays','dialog.pro-replays header','dialog.pro-replays .textbox','.pro-replays-filters','.pro-replay-result']);await run("document.querySelector('dialog.pro-replays').close();");
   await run(`PS.join('options');`);await waitFor(()=>run('return !!document.querySelector("select[name=theme]");'));
   await compare(prefix+'-options',['#room-options select','#room-options button','#room-options input[type=checkbox]','#room-options h2','#room-options label']);await run(`PS.leave('options');PS.focusRoom('${id}');`);
   await run(`__showdownProTheater.toggle('${id}');`);
   for(const [label,chat,calc] of [['expanded',false,false],['chat-folded',true,false],['calc-folded',false,true],['both-folded',true,true]]){
    await run(`const preferences=__showdownProTheater.preferences;if(preferences.chatCollapsed!==${chat})document.querySelector('.pro-theater-chat-header button').click();if(preferences.calcCollapsed!==${calc})document.querySelector('.pro-theater-calc-header button').click();`);
    await waitFor(()=>run(`return document.querySelector('.pro-theater-chat-header').dataset.proTheaterCollapsed==='${chat}'&&document.querySelector('.pro-theater-calc-header').dataset.proTheaterCollapsed==='${calc}';`));await delay(500);
    await compare(prefix+'-theater-'+label,['.pro-theater-chat-header','.pro-theater-chat-header button','.pro-theater-chat-header .fa','.pro-theater-calc-header','.pro-theater-calc-header button','.pro-theater-calc-header .fa','.battle-options','.pro-theater-divider','.battle-controls button']);
   }
   await run('__showdownProTheater.exit();');
  }
 }
 report.success=true;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log('LAYOUT ALL PASSED');
};
