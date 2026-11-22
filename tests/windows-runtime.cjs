const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
module.exports=async(context)=>{
 const {window,client,state,waitFor}=context,wc=client.webContents,out=process.env.CONTROLS_EVIDENCE;
 fs.mkdirSync(out,{recursive:true});
 const run=source=>wc.executeJavaScript(source);
 await window.webContents.executeJavaScript(`(async()=>{await pro.setSetting('addon:showdownPlus',true);await pro.reload();})()`);
 await waitFor(()=>state().showdexStatus==='Showdex loaded'&&state().addons.some(a=>a.key==='showdownPlus'&&a.active));
 await new Promise(r=>setTimeout(r,5000));
 const diagnostics=await run(`({theme:PS.prefs.theme,glass:!!window.__okayuGlass,loader:document.documentElement.dataset.phdLoaderError,stage:document.documentElement.dataset.phdLoaderStage,panels:!!window.__okayuShowdownPlusPanels,controls:!!window.__showdownProBattleMessages,scripts:[...document.scripts].map(s=>s.src).filter(s=>/extension/.test(s)),body:document.body.innerText.slice(0,150)})`);
 fs.writeFileSync(path.join(out,'runtime.json'),JSON.stringify({state:state(),diagnostics},null,2));
 console.log('WINDOWS RUNTIME',JSON.stringify(diagnostics));
 assert.equal(diagnostics.theme,'okayu');assert.equal(diagnostics.glass,false);assert.equal(diagnostics.controls,true);
 try {await require(process.env.OKAYU_CONTROLS_TEST)(context);}
 finally {if(process.env.CONTROLS_SKIP_CAPTURE!=='1')fs.writeFileSync(path.join(out,'runtime.png'),(await wc.capturePage()).toPNG());}
};
