/* Inspect own team without choosing. Confirm delegates to the original switch button. */
(()=>{
 if(window.okayuTeamPanel)return;let index=0,currentRoom=null,detail,confirm,back,committing=false;
 const teamModes=new Set(['pokemon','forced']);
 function clear(){detail?.remove();confirm?.remove();back?.remove();detail=confirm=back=null;}
 function preview(root,room){
  const cards=[...root.querySelectorAll('.switchmenu [data-cmd^="/switch "]')],card=cards.find(b=>Number(b.dataset.cmd.split(' ')[1])===index+1)||cards[0];if(!card)return;
  index=Number(card.dataset.cmd.split(' ')[1])-1;for(const b of cards){b.classList.toggle('okayu-team-selected',b===card);b.setAttribute('aria-pressed',String(b===card));}
  const p=room.request?.side?.pokemon[index];if(!p)return;
  const dex=room.battle.dex,heading=document.createElement('h2');heading.textContent=p.name||p.ident.replace(/^p\d: /,'');detail.replaceChildren(heading);
  const type=document.createElement('p'),species=dex.species.get(p.speciesForme||p.name);type.textContent=(species.types||[]).join(' / ');detail.append(type);
  const moves=document.createElement('div');moves.className='okayu-team-moves';
  for(const id of p.moves||[]){const move=dex.moves.get(id),row=document.createElement('div'),name=document.createElement('span'),pp=document.createElement('span');row.className='okayu-team-move';name.textContent=window.TL?TL(move):move.name;const type=document.createElement('small');type.className='okayu-team-move-type';type.textContent=move.type;const data=room.request?.active?.[index]?.moves?.find(m=>m.id===move.id);pp.textContent=data?data.pp+'/'+data.maxpp:'PP: —';row.append(name,type,pp);moves.append(row);}detail.append(moves);
  const ability=dex.abilities.get(p.ability||p.baseAbility||''),label=document.createElement('h3'),description=document.createElement('p');label.textContent=ability.exists?(window.TL?TL(ability):ability.name):'Habilidad';description.textContent=dex.text.get(ability)?.desc||dex.text.get(ability)?.shortDesc||'';detail.append(label,description);
  const full=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Información completa';full.append(summary);
  // Native tooltip provides exact known HP/status/stats; never estimate hidden data.
  room.battle.scene.tooltips.showTooltip(card);if(BattleTooltips.elem){const content=BattleTooltips.elem.cloneNode(true);BattleTooltips.hideTooltip();full.append(content);}detail.append(full);
  confirm.disabled=card.getAttribute('aria-disabled')==='true'||card.classList.contains('disabled');confirm.onclick=e=>{e.preventDefault();e.stopPropagation();if(confirm.disabled)return;const target=root.querySelector('.switchmenu [data-cmd="/switch '+(index+1)+'"]');if(!target||target.getAttribute('aria-disabled')==='true'||target.classList.contains('disabled'))return;committing=true;try{target.click();}finally{committing=false;}};
 }
 function sync(root,room,phase){
  if(!teamModes.has(phase)){clear();return;}
  if(currentRoom!==room){currentRoom=room;index=0;}
  if(!detail){detail=document.createElement('section');detail.id='okayu-team-detail';detail.setAttribute('aria-label','Información del Pokémon seleccionado');confirm=document.createElement('button');confirm.id='okayu-team-confirm';confirm.textContent='Confirmar cambio';back=document.createElement('button');back.id='okayu-team-back';back.textContent='← Volver';back.onclick=e=>{e.preventDefault();e.stopPropagation();window.okayuAndroid.back();};document.body.append(detail,confirm,back);}
  back.hidden=phase==='forced';for(const card of root.querySelectorAll('.switchmenu [data-cmd^="/switch "]')){const p=room.request?.side?.pokemon[Number(card.dataset.cmd.split(' ')[1])-1];if(!p)continue;let info=card.querySelector('.okayu-team-health');if(!info){info=document.createElement('small');info.className='okayu-team-health';card.append(info);}const value=(p.fainted?'Debilitado':p.hp+' / '+p.maxhp)+' · Nv. '+(p.level||100);if(info.textContent!==value)info.textContent=value;}
  const selected=root.querySelector('.switchmenu [data-cmd="/switch '+(index+1)+'"]');if(selected)confirm.disabled=selected.getAttribute('aria-disabled')==='true'||selected.classList.contains('disabled');

  if(detail.__request!==room.request||detail.__selected!==index||detail.__source!==root.querySelector('.switchmenu')){detail.__request=room.request;detail.__selected=index;detail.__source=root.querySelector('.switchmenu');preview(root,room);}
 }
 document.addEventListener('click',event=>{if(committing||!teamModes.has(document.documentElement.dataset.okayuMenu))return;const card=event.target.closest?.('.okayu-active-battle .switchmenu [data-cmd^="/switch "]');if(!card)return;event.preventDefault();event.stopImmediatePropagation();index=Number(card.dataset.cmd.split(' ')[1])-1;const root=card.closest('[id^="room-"]'),room=PS.rooms[root.id.slice(5)];preview(root,room);},true);
 window.okayuTeamPanel={sync,clear};
})();
