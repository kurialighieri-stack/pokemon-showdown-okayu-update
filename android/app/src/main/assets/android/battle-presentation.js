/* Android presentation adapters: no decisions, battle state or animation timing changes. */
(()=>{
 const anchors=new WeakMap();
 window.okayuBattlePerspective={
  anchor(scene,sp,original){if(scene.battle?.gameType!=='doubles'||sp.__phdFront!==false)return original;const a=anchors.get(scene)?.get(sp);return a?{...original,...a,scale:original.scale*1.12*1.30}:original;},
  refresh(root,room,geometry){
   root.dataset.okayuDoubles=String(room.battle.gameType==='doubles');
   // Place active status chips against the measured HP cards, not desktop offsets.
   if(innerWidth>=1000){const layer=root.querySelector('.phd-layer');if(layer){const frame=layer.getBoundingClientRect(),active=new Set();for(const side of [room.battle.nearSide,room.battle.farSide])for(const pokemon of side.active||[]){const sprite=pokemon?.sprite,card=sprite?.__phdPanel,chip=sprite?.__phdChips;if(!card||!chip)continue;active.add(chip);if(!chip.hasAttribute('data-okayu-active-hud'))chip.setAttribute('data-okayu-active-hud','');const box=card.getBoundingClientRect(),left=(box.left+box.width/2-frame.left)/geometry.scale-chip.offsetWidth/2,top=side===room.battle.farSide?(box.bottom-frame.top+6)/geometry.scale:(box.top-frame.top-6)/geometry.scale-chip.offsetHeight;for(const [key,value] of [['--okayu-chip-left',left+'px'],['--okayu-chip-top',top+'px']])if(chip.style.getPropertyValue(key)!==value)chip.style.setProperty(key,value);}for(const chip of root.querySelectorAll('.phd-chips[data-okayu-active-hud]'))if(!active.has(chip))chip.removeAttribute('data-okayu-active-hud');}}
   if(room.battle.gameType!=='doubles')return;
   const scene=room.battle.scene,old=anchors.get(scene),next=new Map();
   for(const panel of root.querySelectorAll('.phd-row.player pokemon-hp')){const sprite=panel.__phdSprite;if(!sprite?.sp)continue;const rect=panel.getBoundingClientRect();if(!rect.width)continue;const a={cx:Math.max(50,(rect.left+rect.width/2-geometry.left)/geometry.scale),bottom:(rect.top-geometry.top)/geometry.scale-8};next.set(sprite.sp,a);const previous=old?.get(sprite.sp);if(!previous||Math.abs(previous.cx-a.cx)>.5||Math.abs(previous.bottom-a.bottom)>.5)scene.__okayuPerspectiveDirty=true;}
   if(!next.size)return;anchors.set(scene,next);
   if(scene.__okayuPerspectiveDirty&&room.battle.atQueueEnd){scene.__okayuPerspectiveDirty=false;for(const p of room.battle.nearSide.active||[])p?.sprite?.animReset();scene.rebuildTooltips?.();}
  }
 };
 // Translate at display time, including banners queued before a language change.
 customElements.whenDefined('pokemon-ability-panel').then(()=>{
  const proto=customElements.get('pokemon-ability-panel').prototype;if(proto.__okayuLocalized)return;proto.__okayuLocalized=true;
  const translate=value=>{const raw=String(value||''),ability=window.Dex?.abilities.get(raw);return ability?.exists&&window.TL?TL(ability):raw;};
  const show=proto.show;proto.show=function(data={}){if(!this.shadowRoot.querySelector('[data-okayu-tablet-banner]')){const style=document.createElement('style');style.dataset.okayuTabletBanner='';style.textContent='@media(min-width:1000px){.panel{width:36%;height:16%}span{font-size:clamp(calc(24px / var(--okayu-scale)),10cqw,calc(40px / var(--okayu-scale)))}}';this.shadowRoot.append(style);}const result=show.call(this,{...data,ability:translate(data.ability)});const panel=this.panel(data.side||'left');panel.querySelector('.text').children[0].textContent=String(data.name||'');return result;};
  const change=proto.change;proto.change=function(side,ability){return change.call(this,side,translate(ability));};
 });
})();
