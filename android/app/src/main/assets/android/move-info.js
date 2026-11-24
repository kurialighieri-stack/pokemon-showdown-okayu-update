/* Restyle the original computed tooltip; keep every native field and touch handler. */
(()=>{
 const proto=window.BattleTooltips?.prototype;if(!proto||proto.__okayuMoveInfo)return;proto.__okayuMoveInfo=true;const original=proto.showTooltip;
 proto.showTooltip=function(element){const result=original.apply(this,arguments),card=BattleTooltips.elem;if(!card||!card.matches('.tooltip-move,.tooltip-zmove,.tooltip-maxmove')||card.dataset.okayuMoveInfo)return result;
  card.dataset.okayuMoveInfo='true';const heading=card.querySelector(':scope>h2');if(!heading)return result;
  const stats=document.createElement('div'),description=document.createElement('div');stats.className='okayu-move-stats';description.className='okayu-move-description';let details=false;
  for(const node of [...card.childNodes]){if(node===heading)continue;if(node.nodeType===1&&node.classList.contains('tooltip-section'))details=true;(details?description:stats).append(node);}
  const pp=element.querySelector('.pp');if(pp){const value=document.createElement('span');value.className='okayu-tooltip-pp';value.textContent=pp.textContent.trim();heading.append(value);}
  const close=document.createElement('button');close.type='button';close.className='okayu-tooltip-close';close.textContent='← Cerrar';close.setAttribute('aria-label','Cerrar información del movimiento');close.onclick=event=>{event.preventDefault();event.stopPropagation();BattleTooltips.hideTooltip();};
  card.append(stats,description,close);card.addEventListener('click',event=>event.stopPropagation());return result;
 };
})();
