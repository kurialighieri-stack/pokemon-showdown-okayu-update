// Hook for the original Pro --smoke-test harness, disposable AppDir/profile only.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
module.exports=async({window,client,state,waitFor,root})=>{
 console.log('GLASS NATIVE START');window.setSkipTaskbar(true);window.setOpacity(.01);window.showInactive();window.webContents.setBackgroundThrottling(false);client.webContents.setBackgroundThrottling(false);
 const run=code=>client.webContents.executeJavaScript(`(async()=>{${code}})()`),hub=code=>window.webContents.executeJavaScript(`(async()=>{${code}})()`);
 await waitFor(()=>hub('return !!document.getElementById("okayu-glass-card");'));
 await hub("await pro.setSetting('sidebarTab','addons');await pro.setSetting('okayuGlass',{enabled:true,useSystem:false,opacity:.55,blur:6});");
 const choose=async value=>{await run(`PS.prefs.set('theme',${JSON.stringify(value)});`);await waitFor(()=>state().theme===value);await waitFor(()=>run(`return document.documentElement.dataset.okayuGlass===${JSON.stringify(['pro','okayu'].includes(value)?'on':'off')};`));};
 const reports={};
 for(const theme of ['pro','okayu','light','dark']){
  await choose(theme);console.log('GLASS THEME',theme);
  const value=await hub("const root=document.documentElement,sidebar=document.querySelector('.sidebar'),s=getComputedStyle(sidebar);return {active:root.dataset.okayuGlass,alpha:root.style.getPropertyValue('--okayu-glass-alpha'),blur:s.backdropFilter,background:s.backgroundColor,body:getComputedStyle(document.body).backgroundColor,textOpacity:s.opacity};");
  assert.equal(value.active,['pro','okayu'].includes(theme)?'on':'off');
  if(['pro','okayu'].includes(theme)){assert.equal(value.blur,'blur(6px)');assert.equal(value.textOpacity,'1');assert.equal(value.body,'rgba(0, 0, 0, 0)');}
  reports[theme]=value;
 }
 await choose('okayu');
 await hub("const a=document.getElementById('okayu-glass-transparency'),b=document.getElementById('okayu-glass-blur');a.value='60';a.dispatchEvent(new Event('change'));await new Promise(r=>setTimeout(r,200));b.value='10';b.dispatchEvent(new Event('change'));");
 await waitFor(()=>state().okayuGlass.settings.opacity===.4&&state().okayuGlass.settings.blur===10);
 await waitFor(()=>run("return document.documentElement.style.getPropertyValue('--okayu-glass-blur')==='10px';"));
 const before=state().okayuGlass.settings;
 const loaded=new Promise(resolve=>client.webContents.once('dom-ready',resolve));client.webContents.reload();await loaded;
 await waitFor(()=>run("return document.documentElement.dataset.okayuGlass==='on';"));assert.deepEqual(state().okayuGlass.settings,before);
 if(state().okayuGlass.system.available){await hub("document.getElementById('okayu-glass-system').click();");await waitFor(()=>state().okayuGlass.settings.useSystem);assert.equal(state().okayuGlass.effective.opacity,state().okayuGlass.system.opacity);assert.equal(await hub("return document.getElementById('okayu-glass-transparency').disabled;"),true);}
 await hub("await pro.setSetting('okayuGlass',{enabled:true,useSystem:false,opacity:.4,blur:10});await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));");
 const out=process.env.OKAYU_GLASS_EVIDENCE||path.join(root,'test-results/glass');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'card.png'),(await window.webContents.capturePage({x:Math.max(0,window.getContentSize()[0]-360),y:0,width:360,height:window.getContentSize()[1]})).toPNG());
 await hub("await pro.setSetting('okayuGlass',{enabled:false,useSystem:false,opacity:.4,blur:10});");await waitFor(()=>run("return document.documentElement.dataset.okayuGlass==='off';"));
 reports.backend=state().okayuGlass.backend;reports.system=state().okayuGlass.system;reports.success=true;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(reports,null,2));console.log('GLASS NATIVE PASSED',JSON.stringify(reports));
};
