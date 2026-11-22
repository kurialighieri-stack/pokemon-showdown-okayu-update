// Offline Electron fixture; run only with an isolated disposable AppDir.
const {app,BrowserWindow,WebContentsView}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const repo=path.resolve(__dirname,'..'),glass=require(path.join(repo,'modules/glass/files/app/okayu-glass.cjs'));
if(process.env.GLASS_NATIVE_APP)require(path.join(process.env.GLASS_NATIVE_APP,'app/linux-integration.cjs')).configureLinuxRuntime(app);
const out=path.resolve(process.env.GLASS_FIXTURE_EVIDENCE||'test-results/glass-fixture');fs.mkdirSync(out,{recursive:true});app.setPath('userData',path.join(out,'isolated-profile'));
const pause=ms=>new Promise(r=>setTimeout(r,ms));let window,client;
setTimeout(()=>app.exit(2),45000).unref();
app.whenReady().then(async()=>{
 glass.set({enabled:true,useSystem:false,opacity:.55,blur:0});
 window=glass.createWindow({width:1200,height:800,show:false,...glass.windowOptions(),webPreferences:{backgroundThrottling:false}});window.setOpacity(.01);window.setSkipTaskbar(true);
 const css=`html,body{margin:0;width:100%;height:100%;color:#eef;font:16px Arial;background:#102331}.sidebar{position:absolute;right:0;top:0;width:360px;height:100%;background:#203d51}.card,.menu,.nested,button{background:#352c43;border:2px solid #725c8c;padding:12px}.card::before{content:'';display:block;width:80px;height:20px;background:linear-gradient(#253e50,#142838)}.nested{box-shadow:inset 0 0 12px #102331}.battle{position:absolute;left:20px;top:80px;width:240px;height:140px;background:repeating-linear-gradient(45deg,#66cc33 0 10px,#449922 10px 20px);color:#fff}.battle img{width:32px;height:32px}.checker{position:absolute;left:300px;top:80px;width:300px;height:160px;background:repeating-linear-gradient(90deg,#000 0 4px,#fff 4px 8px)}.ps-popup{position:absolute;left:320px;top:100px;width:240px;height:120px;background:#352c43;border:2px solid #725c8c}.card{position:absolute;left:20px;top:280px;width:240px}.second{left:320px}`;
 await window.loadURL('data:text/html,'+encodeURIComponent('<style>'+css+'</style><div class="sidebar"><h1>Battle Hub</h1><div class="card" style="position:static">Hub card</div></div>'));
 client=new WebContentsView({webPreferences:{backgroundThrottling:false}});window.contentView.addChildView(client);client.setBounds({x:0,y:0,width:840,height:760});
 await client.webContents.loadURL('data:text/html,'+encodeURIComponent('<style>'+css+'</style><div class="battle">Battle text<br>HP 100/100 <span class="fa">★</span></div><div role="img" class="checker"></div><div class="ps-popup">Menu text</div><div class="card"><p>Card text</p><div class="nested">Nested card <button>Button</button></div></div><div class="card second">Second card</div>'));
 // Exercise user-origin theme declarations, not just ordinary author styles.
 await client.webContents.insertCSS('.card{background:#352c43!important}.card::before{background:linear-gradient(#253e50,#142838)!important}',{cssOrigin:'user'});
 window.showInactive();let theme='pro';await glass.attach({window,client,getTheme:()=>theme,publish(){}});
 const run=code=>client.webContents.executeJavaScript(`(()=>{${code}})()`),hub=code=>window.webContents.executeJavaScript(`(()=>{${code}})()`);
 const protectedBefore=(await client.webContents.capturePage({x:20,y:80,width:240,height:140})).toBitmap();
 const settings={enabled:true,useSystem:false,opacity:.55,blur:0};glass.set(settings);await pause(350);
 const p=await run("return [...document.querySelectorAll('.card,.nested,button')].map(e=>({color:getComputedStyle(e).backgroundColor,image:getComputedStyle(e).backgroundImage,shadow:getComputedStyle(e).boxShadow,pseudo:getComputedStyle(e,'::before').backgroundImage,opacity:getComputedStyle(e).opacity}));");
 assert.ok(p.every(v=>v.opacity==='1'&&v.image==='none'&&v.pseudo==='none'));console.log('FIXTURE PAINT',JSON.stringify(p));
 await run(`const node=document.createElement('div');node.id='dynamic-card';node.className='card';node.textContent='Mounted after Glass';document.body.append(node);`);await pause(200);
 assert.equal(await run("return getComputedStyle(document.getElementById('dynamic-card'),'::before').backgroundImage;"),'none','New surfaces are adapted without manual refresh');
 const idleRuns=await run('return window.__okayuGlassStats.runs;');await run("for(let i=0;i<20;i++)document.querySelector('.battle').style.setProperty('--animation-frame',i);");await pause(200);assert.equal(await run('return window.__okayuGlassStats.runs;'),idleRuns,'Battle animation mutations do not cause surface scans');
 const protectedAfter=(await client.webContents.capturePage({x:20,y:80,width:240,height:140})).toBitmap();assert.deepEqual(protectedAfter,protectedBefore,'Battle pixels remain identical');
 const alpha=await run("const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const c=canvas.getContext('2d');c.fillStyle=getComputedStyle(document.body).backgroundColor;c.fillRect(0,0,1,1);return c.getImageData(0,0,1,1).data[3]/255;");assert.ok(Math.abs(alpha-.55)<.01,'Single body plane has desired alpha');
 async function contrast(){const image=await client.webContents.capturePage({x:340,y:170,width:160,height:1}),pixels=image.toBitmap(),values=[];for(let i=0;i<pixels.length;i+=4)values.push(pixels[i]);const mean=values.reduce((a,b)=>a+b,0)/values.length;return Math.sqrt(values.reduce((sum,n)=>sum+(n-mean)**2,0)/values.length);}
 const before=await contrast();glass.set({...settings,blur:16});await pause(300);const after=await contrast();assert.ok(before>30&&after<before*.4,'Real in-app pixel blur: '+JSON.stringify({before,after}));
 fs.writeFileSync(path.join(out,'client.png'),(await client.webContents.capturePage()).toPNG());
 const mainView=window.contentView.children.find(v=>v.webContents===window.webContents);assert.ok(mainView,'Hub native View found');
 glass.setTheater(true);client.setBounds({x:0,y:0,width:window.getContentSize()[0],height:window.getContentSize()[1]});await pause(200);
 const capture=await window.webContents.capturePage({x:window.getContentSize()[0]-360,y:0,width:360,height:window.getContentSize()[1]},{stayHidden:true,stayAwake:true});assert.ok(!capture.isEmpty(),'Underlying Hub remains capturable');fs.writeFileSync(path.join(out,'hidden-hub.png'),capture.toPNG());
 glass.setTheater(false);theme='okayu';glass.sync(theme);await pause(200);assert.ok((await run('return getComputedStyle(document.body).backgroundColor;')).includes('53, 44, 67'));
 const popup=new BrowserWindow({show:false,...glass.windowOptions(),webPreferences:{backgroundThrottling:false}});await popup.loadURL('data:text/html,'+encodeURIComponent('<style>'+css+'</style><h1>Settings menu</h1><div class="card">Settings card</div>'));await glass.attachPopup(popup);popup.setOpacity(.01);popup.showInactive();await pause(200);assert.ok((await popup.webContents.executeJavaScript('getComputedStyle(document.body).backgroundColor')).includes('0.55'));popup.close();
 glass.set({...settings,enabled:false});await pause(200);assert.equal(await run('return getComputedStyle(document.querySelector(".card")).backgroundColor;'),'rgb(53, 44, 67)');
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({success:true,paint:p,bodyAlpha:alpha,blur:{before,after},battlePixelsIdentical:true,hubCapturable:true},null,2));console.log('FIXTURE PASS',JSON.stringify({before,after}));window.destroy();app.exit(0);
}).catch(error=>{console.error(error.stack);app.exit(1);});
