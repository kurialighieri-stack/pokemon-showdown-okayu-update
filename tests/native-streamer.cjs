// Native integration/benchmark hook for Pro's isolated --smoke-test harness.
// Run only against a disposable extracted copy; never an active player profile.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
module.exports=async({window,client,root,state,waitFor,getMirror})=>{
 console.log('OKAYU PERF starting');window.setSkipTaskbar(true);window.setOpacity(.01);window.showInactive();
 const wc=client.webContents;wc.setBackgroundThrottling(false);
 const run=code=>wc.executeJavaScript(`(async()=>{${code}})()`),setting=(key,value)=>window.webContents.executeJavaScript(`pro.setSetting(${JSON.stringify(key)},${JSON.stringify(value)})`);
 window.setContentSize(1536,960);
 if(state().settings.foulPlayEnabled!==undefined)await setting('foulPlayEnabled',false);await setting('sidebarCollapsed',false);
 await waitFor(()=>run("return !!window.__showdownProTheater&&!!document.querySelector('[data-showdex-module=hellodex]');"));
 const {history,request}=require(path.join(root,'tests/fixtures.cjs')),id='battle-gen9randombattle-998971';
 await run(`const host=window.app||window.PS;if(window.app){app.socket.send=()=>{};app.user.set({name:'ProTest',named:true});}else{PS.connection.send=()=>{};PS.user.setName('ProTest',true,'1');}host.receive(${JSON.stringify('>'+id+'\n'+history().filter(x=>!x.startsWith('|request|')).join('\n'))});host.receive(${JSON.stringify('>'+id+'\n|request|'+JSON.stringify(request()))});host.focusRoom('${id}');`);
 await waitFor(()=>run(`return !!(window.app||window.PS).rooms['${id}']?.battle;`));
 await run(`(window.app||window.PS).rooms['${id}'].battle.seekTurn(Infinity);`);
 await run("const marker=document.createElement('div');marker.id='okayu-perf-counter';marker.style='position:fixed;left:8px;top:65px;width:100px;height:20px;background:black;color:white;z-index:999999';document.body.append(marker);window.__okayuFrames=0;const animate=()=>{const n=++window.__okayuFrames;marker.textContent='Frame '+n;marker.style.backgroundColor='rgb('+(n%256)+','+((n>>8)%256)+','+((n>>16)%256)+')';window.__okayuRAF=requestAnimationFrame(animate);};animate();");
 console.log('OKAYU PERF mounted');const reports=[];
 for(const config of [
  {name:'source-only',theater:false,enabled:false,hub:false,shown:false},
  {name:'source-theater',theater:true,enabled:false,hub:false,shown:false},
  {name:'normal-private',theater:false,enabled:true,hub:false,shown:false},
  {name:'theater-private',theater:true,enabled:true,hub:false,shown:false},
  {name:'theater-showdex-hub',theater:true,enabled:true,hub:true,shown:true},
  {name:'normal-showdex-hub',theater:false,enabled:true,hub:true,shown:true},
 ]){
  await setting('streamerEnabled',false);
  await run(`if(Boolean(__showdownProTheater.active)!==${config.theater})__showdownProTheater.toggle('${id}');`);
  if(config.theater)await run("await showdownProEvents.setTheaterLayout({width:420,chatShare:.45,chatCollapsed:false,calcCollapsed:false});");
  await pause(1500);
  for(const [key,value] of Object.entries({streamerShowHub:config.hub,streamerShowShowdex:config.shown,streamerShowMoves:config.shown,streamerShowPokemonTooltips:config.shown,streamerShowTeras:config.shown}))await setting(key,value);
  const mirror=getMirror();
  if(config.enabled){
   await setting('streamerEnabled',true);mirror.window.setSkipTaskbar(true);mirror.window.setOpacity(.01);mirror.window.showInactive();mirror.window.webContents.setBackgroundThrottling(false);
   await pause(1200);
  }
  if(config.name==='theater-private'&&process.env.OKAYU_CPU_PROFILE){wc.debugger.attach('1.3');await wc.debugger.sendCommand('Profiler.enable');await wc.debugger.sendCommand('Profiler.start');}
  const before=structuredClone(mirror.stats),source=await run('return window.__okayuFrames;'),start=performance.now(),cpu=process.cpuUsage();
  await pause(4000);const elapsed=performance.now()-start,used=process.cpuUsage(cpu),after=structuredClone(mirror.stats),sourceEnd=await run('return window.__okayuFrames;');
  if(config.name==='theater-private'&&process.env.OKAYU_CPU_PROFILE){const profile=await wc.debugger.sendCommand('Profiler.stop');fs.writeFileSync(process.env.OKAYU_CPU_PROFILE,JSON.stringify(profile));wc.debugger.detach();}
  const diff=key=>after[key]-before[key],samples=after.stages.samples-before.stages.samples;
  const report={...config,sourceFps:(sourceEnd-source)*1000/elapsed,paintedFps:diff('painted')*1000/elapsed,mainCpuMs:(used.user+used.system)/1000,bytesPerSecond:diff('bytes')*1000/elapsed,dropped:diff('dropped'),samples,stageMs:Object.fromEntries(['capture','mask','encode','after','before','ack'].map(k=>[k,(after.stages[k]-before.stages[k])/Math.max(1,samples)])),hubWidth:mirror.lastFrame?.hub?.displayWidth||0,error:mirror.lastError||null};
  console.log('OKAYU PERF',JSON.stringify(report));reports.push(report);
  if(config.enabled&&!process.env.OKAYU_BASELINE){assert.ok(report.paintedFps>0,'Stream must keep painting: '+config.name);if(config.hub)assert.equal(report.hubWidth,360,'Hub remains available in theater');}
  if(config.enabled&&mirror.lastFrame){
   const {collectMirrorMap,maskRectangles}=require(path.join(root,'app/streamer-mode.cjs'));
   const map=await run(`return (${collectMirrorMap})(${JSON.stringify({showdex:config.shown,moves:config.shown,tooltips:config.shown,teras:config.shown})});`);
   if(!config.shown){const frame=mirror.lastFrame.client;for(const r of maskRectangles(map.masks,map,frame)){
    const x=r.x+Math.floor(r.width/2),y=r.y+Math.floor(r.height/2),top=maskRectangles(map.masks,map,frame).findLast(b=>x>=b.x&&x<b.x+b.width&&y>=b.y&&y<b.y+b.height),color=top.color||[20,40,56,255],expected=frame.format==='bgra'?[color[2],color[1],color[0],255]:color;
    assert.deepEqual([...frame.pixels.subarray((y*frame.width+x)*4,(y*frame.width+x)*4+4)],expected,'Private controls remain masked');
   }}
   if(process.env.OKAYU_PERF_SCREENSHOT&&config.name==='theater-showdex-hub')fs.writeFileSync(process.env.OKAYU_PERF_SCREENSHOT,(await mirror.window.webContents.capturePage()).toPNG());
  }
 }
 if(process.env.OKAYU_ORIGINAL_STREAMER){
  await setting('streamerEnabled',false);await run(`if(!__showdownProTheater.active)__showdownProTheater.toggle('${id}');`);await pause(1500);
  const original=require(process.env.OKAYU_ORIGINAL_STREAMER).collectMirrorMap,current=require(path.join(root,'app/streamer-mode.cjs')).collectMirrorMap;
  const measurements=[];
  for(const [name,fn] of [['original',original],['current',current],['original',original],['current',current]]){
   const result=await run(`const fn=(${fn});const times=[];let map;for(let i=0;i<8;i++){const start=performance.now();map=fn({showdex:false,moves:false,tooltips:false,teras:false});times.push(performance.now()-start);}return {times,map};`);
   measurements.push({name,times:result.times,map:result.map});
  }
  assert.deepEqual(measurements[0].map.masks,measurements[1].map.masks,'Optimized geometry matches the original on the same live layout');
  fs.writeFileSync(process.env.OKAYU_PERF_REPORT+'.maps.json',JSON.stringify(measurements.map(({name,times})=>({name,times})),null,2));
 }
 await setting('streamerEnabled',false);await run('cancelAnimationFrame(window.__okayuRAF);document.getElementById("okayu-perf-counter").remove();');
 fs.writeFileSync(process.env.OKAYU_PERF_REPORT||path.join(root,'test-results/okayu-streamer-performance.json'),JSON.stringify(reports,null,2));
};
