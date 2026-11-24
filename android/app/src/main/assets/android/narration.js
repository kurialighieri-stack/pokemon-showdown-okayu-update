/* Presentation only. Never returns a promise to or delays the battle animation queue. */
(()=>{
 if(window.okayuNarration)return;
 let box,visual,accessible,frame=0,expiry=0,currentScene=null;
 let speed=22;try{const saved=localStorage.getItem('okayu.narrationSpeed');if(saved!==null&&Number.isFinite(Number(saved)))speed=Math.max(0,Math.min(40,Number(saved)));}catch{}
 function clear(){cancelAnimationFrame(frame);clearTimeout(expiry);frame=0;if(box)box.hidden=true;document.documentElement.classList.remove('okayu-narrating');}
 function elements(){if(box)return;box=document.createElement('div');box.id='okayu-narration';box.hidden=true;box.setAttribute('role','status');visual=document.createElement('span');visual.setAttribute('aria-hidden','true');accessible=document.createElement('span');accessible.className='okayu-narration-accessible';accessible.setAttribute('aria-live','polite');box.append(visual,accessible);document.body.append(box);}
 function textOf(html){const t=document.createElement('template');t.innerHTML=String(html);for(const br of t.content.querySelectorAll('br'))br.replaceWith('\n');return (t.content.textContent||'').replace(/\s+/g,' ').trim();}
 function show(scene,html){
  const active=document.querySelector('.okayu-active-battle'),room=active&&window.PS?.rooms[active.id.replace(/^room-/,'')];
  if(scene.battle!==room?.battle||!scene.animating||document.documentElement.classList.contains('pro-hide-battle-messages'))return;
  const text=textOf(html);if(!text)return;elements();clear();currentScene=scene;box.hidden=false;document.documentElement.classList.add('okayu-narrating');visual.textContent='';accessible.textContent=text;
  const chars=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(text)].map(s=>s.segment):Array.from(text);
  const budget=(Number(scene.battle.messageShownTime)||800)/Math.max(1,Number(scene.acceleration)||1),duration=(speed===0||matchMedia('(prefers-reduced-motion: reduce)').matches)?0:Math.min(1000,chars.length*speed,Math.max(140,budget*.85));
  const start=performance.now();
  const tick=now=>{if(currentScene!==scene||document.documentElement.classList.contains('pro-hide-battle-messages')){clear();return;}const count=duration?Math.min(chars.length,Math.max(1,Math.ceil(chars.length*(now-start)/duration))):chars.length;visual.textContent=chars.slice(0,count).join('');if(count<chars.length)frame=requestAnimationFrame(tick);else expiry=setTimeout(clear,1600);};
  frame=requestAnimationFrame(tick);
 }
 function install(){const proto=window.BattleScene?.prototype;if(!proto||proto.__okayuNarration)return false;proto.__okayuNarration=true;const original=proto.message;proto.message=function(...args){const result=original.apply(this,args);show(this,args[0]);return result;};const reset=proto.reset;if(reset)proto.reset=function(...args){if(currentScene===this)clear();return reset.apply(this,args);};return true;}
 window.okayuNarration={clear,show,textOf,get speed(){return speed;},setSpeed(value){if(!Number.isFinite(value)||value<0||value>40)return;speed=value;try{localStorage.setItem('okayu.narrationSpeed',String(value));}catch{}}};if(!install())addEventListener('load',install,{once:true});
})();
