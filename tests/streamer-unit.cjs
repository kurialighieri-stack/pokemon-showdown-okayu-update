const test=require('node:test'),assert=require('node:assert/strict'),Module=require('node:module'),zlib=require('node:zlib');
const implementation=require('../modules/performance/files/app/streamer-mode.cjs');
// Fake only Electron's native PNG decode; pixel masking and encoding stay real.
const nativeImage={createFromBuffer(png){let offset=8,raw;while(offset<png.length){const n=png.readUInt32BE(offset),kind=png.toString('ascii',offset+4,offset+8);if(kind==='IDAT')raw=zlib.inflateSync(png.subarray(offset+8,offset+8+n));offset+=n+12;}return {toBitmap:()=>Buffer.from([raw[3],raw[2],raw[1],raw[4]])};}};
const oldLoad=Module._load;Module._load=function(name,...rest){return name==='electron'?{nativeImage}:oldLoad.call(this,name,...rest);};
const image=(width,height)=>({getSize:()=>({width,height}),toBitmap:()=>Buffer.alloc(width*height*4,99)});
function rebuild(packet,previous){if(packet.pixels)return Buffer.from(packet.pixels);const bytes=Buffer.from(previous);for(const p of packet.patches)for(let y=0;y<p.height;y++)p.pixels.copy(bytes,((p.y+y)*packet.width+p.x)*4,y*p.width*4,(y+1)*p.width*4);return bytes;}
test('patches reconstruct stationary, sparse, dense and resized frames byte-for-byte',()=>{
 const {encodeFramePart}=implementation;let previous={width:640,height:360,format:'bgra',pixels:Buffer.alloc(640*360*4)};
 for(const kind of ['same','sparse','dense','resize']){
  const part={...previous,pixels:Buffer.from(previous.pixels)};
  if(kind==='sparse')for(let y=20;y<90;y++)part.pixels.fill(255,(y*640+60)*4,(y*640+80)*4);
  if(kind==='dense')part.pixels.fill(45);
  if(kind==='resize'){part.width=320;part.pixels=Buffer.alloc(320*360*4,71);}
  const encoded=encodeFramePart(part,previous);assert.deepEqual(rebuild(encoded,previous.pixels),part.pixels);
  if(kind==='same')assert.equal(encoded.patches.length,0);
  if(kind==='sparse')assert.ok(encoded.patches.reduce((n,p)=>n+p.pixels.length,0)<part.pixels.length/5);
  previous=part;
 }
});
test('private pixel masks cover content while allowed reveals remain intact',()=>{
 const map={width:10,height:10,reveals:[{x:4,y:4,width:2,height:2}]};
 const frame=implementation.maskedFrame(image(10,10),map,[{x:1,y:1,width:8,height:8}],'pro',nativeImage);
 assert.deepEqual([...frame.pixels.subarray((2*10+2)*4,(2*10+2)*4+4)],[56,40,20,255]);
 assert.deepEqual([...frame.pixels.subarray((4*10+4)*4,(4*10+4)*4+4)],[99,99,99,99]);
});
test('hub captures just its rectangle and preserves logical dimensions at HiDPI',async()=>{
 let rectangle,calls=0;const contents={id:1,isDestroyed:()=>false,getBackgroundThrottling:()=>true,setBackgroundThrottling(){},capturePage:async rect=>{rectangle=rect;calls++;return image(720,1800);}};
 const mirror=new implementation.StreamerStream({hub:()=>({contents,x:1176,width:360,height:900})});
 const frame=await mirror.readHub();assert.deepEqual(rectangle,{x:1176,y:0,width:360,height:900});assert.equal(frame.displayWidth,360);assert.equal(frame.width,720);
 assert.equal(await mirror.readHub(),frame);assert.equal(calls,1);
});
test('an invalidation during Hub capture cannot repopulate the cache',async()=>{
 let resolve;const contents={id:1,isDestroyed:()=>false,getBackgroundThrottling:()=>true,setBackgroundThrottling(){},capturePage:()=>new Promise(r=>resolve=r)};
 const mirror=new implementation.StreamerStream({hub:()=>({contents,x:0,width:360,height:900})});
 const pending=mirror.readHub();mirror.epoch++;resolve(image(360,900));await pending;assert.equal(mirror.hubCache,undefined);
});
test('slow viewer applies backpressure before capturing or masking more frames',async()=>{
 let schedules=0,captures=0;const mirror=new implementation.StreamerStream({contents:()=>{captures++;throw Error('must not capture');}});
 mirror.window={isDestroyed:()=>false};mirror.pendingSequence=12;mirror.schedule=()=>schedules++;
 await mirror.tick(mirror.generation);assert.equal(schedules,1);assert.equal(captures,0);assert.equal(mirror.sequence,0);
});
test('privacy changes clear pending display and reject packets from the previous epoch',()=>{
 const sent=[];const mirror=new implementation.StreamerStream({contents:()=>null,visibility:()=>({moves:false})});mirror.window={isDestroyed:()=>false,webContents:{send:(...args)=>sent.push(args)}};
 const epoch=mirror.epoch,signature=mirror.signature();mirror.pendingSequence=5;mirror.invalidate();assert.equal(mirror.pendingSequence,0);assert.equal(sent.at(-1)[1],null);
 mirror.deliver({generation:mirror.generation,epoch,signature,frame:{client:{}}});assert.equal(sent.length,1);
});
test('privacy mapping reuses queries only within one check and reads fresh geometry next time',()=>{
 const saved={window:global.window,document:global.document,MutationObserver:global.MutationObserver,getComputedStyle:global.getComputedStyle,location:global.location,innerWidth:global.innerWidth,innerHeight:global.innerHeight};
 try{
  let queries=0,left=20;
  const panel={getBoundingClientRect:()=>({x:0,y:800,left:0,right:800,top:800,bottom:900,width:800,height:100})};
  const nodes=Array.from({length:200},()=>({matches:()=>false,closest:()=>null,getBoundingClientRect:()=>({x:left,y:20,left,right:left+80,top:20,bottom:60,width:80,height:40})}));
  global.window={};global.location={href:'https://play.pokemonshowdown.com/'};global.innerWidth=1000;global.innerHeight=900;
  global.MutationObserver=class{observe(){}disconnect(){}};global.getComputedStyle=()=>({display:'block',visibility:'visible'});
  global.document={documentElement:{},querySelectorAll(selector){if(selector==='.battle-controls'){queries++;return [panel];}return nodes;}};
  const visibility={showdex:false,moves:true,tooltips:true,teras:true};
  const first=implementation.collectMirrorMap(visibility);assert.equal(queries,1);assert.equal(first.masks.length,200);assert.equal(first.masks[0].x,16);
  left=100;const next=implementation.collectMirrorMap(visibility);assert.equal(queries,2);assert.equal(next.masks[0].x,96,'The after check must not reuse old positions');
 }finally{for(const [key,value] of Object.entries(saved))if(value===undefined)delete global[key];else global[key]=value;}
});
