/* Run after native-battle.js + native-actions.js on an idle, authorized device. */
(async()=>{
 const wait=ms=>new Promise(r=>setTimeout(r,ms)),assert=(v,m)=>{if(!v)throw Error(m);},root=document.querySelector('.okayu-active-battle');
 assert(innerWidth>=1000,'Tablet viewport required');if(document.documentElement.dataset.okayuMenu==='main'){document.querySelector('#okayu-combat-menu button').click();await wait(80);}assert(document.documentElement.dataset.okayuMenu==='moves','Open native moves first');
 const clipped=e=>{const r=e.getBoundingClientRect().toJSON();for(let p=e.parentElement;p;p=p.parentElement){const s=getComputedStyle(p),b=p.getBoundingClientRect();if(s.display==='none'||s.visibility==='hidden')return null;if(/hidden|clip|auto|scroll/.test(s.overflowX)){r.left=Math.max(r.left,b.left);r.right=Math.min(r.right,b.right);}if(/hidden|clip|auto|scroll/.test(s.overflowY)){r.top=Math.max(r.top,b.top);r.bottom=Math.min(r.bottom,b.bottom);}}return r.right>r.left&&r.bottom>r.top?r:null;};
 const visible=e=>{const s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&!!clipped(e);};
 const box=e=>e.getBoundingClientRect(),inside=r=>r.left>=-1&&r.top>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1;
 const intersects=(a,b)=>a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1;
 const cards=[...root.querySelectorAll('.phd-row pokemon-hp')].filter(visible),parties=[...root.querySelectorAll('.phd-team')].filter(visible),toolbar=[...document.querySelectorAll('#okayu-toolbar button')].filter(visible);
 assert(box(root).width>=innerWidth-1,'Battle still clipped by desktop room');
 for(const card of cards){const r=box(card),svg=card.shadowRoot.querySelector('svg');assert(inside(r)&&inside(box(svg)),'HP card cropped');assert(r.width>=Math.min(472.5,(innerWidth-24)/2)-1,'HP card not enlarged');}
 const hud=[...cards,...parties,...toolbar,root.querySelector('.turn'),document.getElementById('okayu-context-back')].filter(visible);
 for(let i=0;i<hud.length;i++){assert(inside(box(hud[i])),'HUD outside viewport');for(let j=i+1;j<hud.length;j++)assert(!intersects(box(hud[i]),box(hud[j])),'HUD collision: '+hud[i].className+' / '+hud[j].className);}
 const moves=[...root.querySelectorAll('.movemenu button')].filter(visible);assert(moves.length>0,'No visible moves');
 for(let i=0;i<moves.length;i++){const r=clipped(moves[i]);assert(inside(r)&&box(moves[i]).height>=71.9,'Move too small or cropped');assert(parseFloat(getComputedStyle(moves[i]).fontSize)>=24,'Move text too small');for(const h of [...cards,document.getElementById('okayu-context-back')].filter(visible))assert(!intersects(r,box(h)),'Move covers HP card');for(const m of moves.slice(i+1))assert(!intersects(r,clipped(m)),'Moves overlap');}
 const chipSprites=[...root.querySelectorAll('.phd-team .picon')].filter(visible);for(const e of chipSprites)assert(inside(box(e)),'Party icon cropped');
 const room=PS.rooms['battle-gen9customgame-999992'],sample={cx:2,bottom:3,scale:1};assert(okayuBattlePerspective.anchor({battle:{gameType:'singles'}},{__phdFront:false},sample)===sample,'UI scaling changed singles sprite size');
 const sprite=room.battle.nearSide.active[0].sprite;assert(Math.abs(okayuBattlePerspective.anchor(room.battle.scene,sprite.sp,sample).scale-1.456)<1e-6,'UI scaling changed doubles sprite size');
 const before=room.battle;okayuAndroid.open('calc');await wait(600);const calc=document.querySelector('[data-okayu-calc-host] [data-showdex-module="calcdex"]')||root.querySelector('[data-showdex-module="calcdex"]');assert(calc&&visible(calc)&&inside(box(calc)),'Calcdex not a full usable overlay');const exit=calc.querySelector('[data-pro-calc="overlay-close"]')||document.getElementById('okayu-utility-back');assert(visible(exit)&&inside(box(exit)),'Calcdex exit unreachable');exit.click();await wait(80);assert(!document.documentElement.dataset.okayuPanel,'Calcdex exit failed');assert(before===room.battle,'Utility recreated battle');
 return {viewport:[innerWidth,innerHeight],fullHP:cards.map(e=>box(e).toJSON()),hudNoOverlap:true,moves:moves.length,partyIcons:chipSprites.length,unchangedPokemonScale:true,calcdexExit:true};
})()
