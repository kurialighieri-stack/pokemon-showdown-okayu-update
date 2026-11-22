const assert=require('node:assert/strict');
module.exports=async({window,client,state})=>{
 assert.equal(window.constructor.name,'BrowserWindow');
 const run=code=>client.webContents.mainFrame.executeJavaScript(code);
 assert.equal(await run('!!window.__okayuGlassSurfaces'),false,'No client Glass adapter when disabled at launch');
 assert.equal(state().okayuGlass.restartRequired,false);
 await window.webContents.mainFrame.executeJavaScript("pro.setSetting('okayuGlass',{enabled:true,useSystem:false,opacity:.55,blur:0})");
 assert.equal(state().okayuGlass.restartRequired,true,'An opaque window must be reopened to enable native transparency');
 assert.equal(await run('!!window.__okayuGlassSurfaces'),false);
 await window.webContents.mainFrame.executeJavaScript("pro.setSetting('okayuGlass',{enabled:false,useSystem:false,opacity:.55,blur:0})");
 assert.equal(state().okayuGlass.restartRequired,false);
 const mutations=await window.webContents.mainFrame.executeJavaScript(`(async()=>{let count=0;const observer=new MutationObserver(changes=>count+=changes.length);observer.observe(document.getElementById('okayu-glass-card'),{subtree:true,childList:true,attributes:true,characterData:true});await pro.setSetting('autoStartTimer',true);await pro.setSetting('autoStartTimer',false);await new Promise(r=>setTimeout(r,100));observer.disconnect();return count;})()`);assert.equal(mutations,0,'Unrelated state updates do not repaint the Glass card');console.log('OPAQUE NATIVE PATH PASSED');
};
