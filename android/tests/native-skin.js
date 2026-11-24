(async()=>{
 const wait=ms=>new Promise(r=>setTimeout(r,ms)),root=document.querySelector('.okayu-active-battle');
 const assert=(v,m)=>{if(!v)throw Error(m);};
 if(document.documentElement.dataset.okayuMenu!=='main'){okayuAndroid.back();await wait(100);}
 document.querySelectorAll('#okayu-combat-menu button')[1].click();await wait(150);
 assert(root.querySelectorAll('.switchmenu button').length===6,'Six team capsules');
 document.querySelector('#okayu-team-back').click();await wait(100);
 document.querySelector('#okayu-combat-menu button').click();await wait(150);
 const moves=[...root.querySelectorAll('.movemenu button.movebutton')];assert(moves.length===4,'Four moves');
 const rects=moves.map(b=>b.getBoundingClientRect());
 for(let i=0;i<moves.length;i++){
  const b=moves[i],s=getComputedStyle(b),r=rects[i],pp=b.querySelector('.pp'),p=pp.getBoundingClientRect();
  assert(r.height>=47.9&&r.width>=210,'Capsule touch geometry');assert(s.backgroundImage==='none','Desktop gradient leaked into moves');
  assert(!b.querySelector('.okayu-team-health')&&!b.hasAttribute('data-okayu-team-state')&&!b.classList.contains('okayu-team-selected'),'Team presentation leaked into moves');
  assert(p.right<=r.right+1&&p.top>=r.top-1&&p.bottom<=r.bottom+1,'PP segment clipped');
  if(i)assert(rects[i-1].bottom+3.8<=r.top,'Move capsules overlap');
 }
 assert(getComputedStyle(moves[0]).backgroundColor!==getComputedStyle(moves[1]).backgroundColor,'Move type colors overridden');
 const tera=root.querySelector('.megaevo-box'),t=tera?.getBoundingClientRect();if(t?.width){assert(tera.scrollWidth<=tera.clientWidth+1,'Transformation capsule scrolls horizontally');for(const r of rects)assert(t.right<=r.left||t.left>=r.right||t.bottom<=r.top||t.top>=r.bottom,'Transformation overlaps move');}
 return {nativeButtons:true,teamToMovesClean:true,distinctTypeColors:true,noDesktopGradients:true,minTouch:48,noMoveOverlap:true,ppInsideCapsule:true,viewport:[innerWidth,innerHeight],moves:rects.map(r=>r.toJSON())};
})()
