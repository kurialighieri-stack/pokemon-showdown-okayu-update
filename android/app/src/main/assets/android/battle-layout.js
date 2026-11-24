(()=>{
 if(window.okayuAndroid)return;
 let menu="main",requestSeen=null,menuNode,backNode,utilityBack,roomSubscription;
 let active=null,panel=null,queued=false,bar,custom,timerTick=0,patched=false,stableHeight=innerHeight,stableWidth=innerWidth;
 const html=document.documentElement;
 function close(nativeClose=true){const calc=panel==='calc';panel=null;if(utilityBack)utilityBack.hidden=true;if(calc&&nativeClose){const root=document.getElementById('room-'+active),host=document.querySelector('[data-okayu-calc-host]');(root?.querySelector('[data-pro-calc="overlay-close"]')||host?.querySelector('[data-pro-calc="overlay-close"]'))?.click();}bar?.removeAttribute("data-attention");schedule();delete html.dataset.okayuPanel;custom?.remove();custom=null;}
 function open(name){if(panel===name){close();return;}close();panel=name;html.dataset.okayuPanel=name;if(utilityBack)utilityBack.hidden=!['log','rooms','hub','credits'].includes(name);
  if(name==='calc'){const room=PS.rooms[active];if(!room)return;const root=document.getElementById('room-'+active);const calcId=room.battle?.calcdexRoomId,calcRoot=calcId&&document.getElementById('room-'+calcId);const existing=root?.querySelector('[data-showdex-module="calcdex"]')||calcRoot?.querySelector('[data-showdex-module="calcdex"]');if(window.__showdownProCalcdex)window.__showdownProCalcdex.open(active);else if(!existing||getComputedStyle(existing.parentElement).display==='none')root?.querySelector('button[name="toggleCalcdexOverlay"]')?.click();schedule();return;}
  if(name==='log')return;
  custom=document.createElement('section');custom.id='okayu-panel';custom.className='okayu-paper-surface';custom.setAttribute('role','dialog');custom.setAttribute('aria-label',name);const heading=document.createElement('h2');heading.textContent=name==='rooms'?'Salas':name==='hub'?'Battle Hub':'Opciones';custom.append(heading);
  if(name==='options'&&window.okayuAndroidOptions){okayuAndroidOptions.mount(custom,close);document.body.append(custom);return;}
  const add=(label,action)=>{const b=document.createElement('button');b.textContent=label;b.onclick=event=>{event.preventDefault();event.stopPropagation();action(event);};custom.append(b);};
  if(name==='rooms')for(const room of Object.values(PS.rooms)){if(room.id)add((room.notifications?.length?'● ':'')+(room.title||room.id),()=>{PS.focusRoom(room.id);close();schedule();});}
  else if(name==='credits'){heading.textContent='Créditos y licencias';const host=custom,pre=document.createElement('pre');pre.style.whiteSpace='pre-wrap';pre.style.fontFamily='inherit';host.append(pre);Promise.all(['/notices/FAN_PROJECT_NOTICE.md','/notices/THIRD_PARTY_NOTICES.md'].map(url=>fetch(url).then(r=>{if(!r.ok)throw Error('Notice missing');return r.text();}))).then(parts=>{pre.textContent=parts.join('\n\n');}).catch(()=>{pre.textContent='No se pudieron cargar los créditos locales.';});}
  else if(name==='hub'){add('Equipos',()=>{PS.join('teambuilder');close();});add('Combates',()=>{PS.join('battles');close();});add('Inicio',()=>{PS.focusRoom('');close();schedule();});}
  else {add('Preferencias',()=>{PS.join('options');close();});add('Actualizaciones',()=>window.open('https://github.com/kurialighieri-stack/pokemon-showdown-okayu-update/releases'));add('Créditos y licencias',async()=>{const text=await fetch('/notices/THIRD_PARTY_NOTICES.md').then(r=>r.text());const pre=document.createElement('pre');pre.style.whiteSpace='pre-wrap';pre.textContent=text;custom?.append(pre);});add('Textos de combate',()=>window.__showdownProBattleMessages?.setHidden(!window.__showdownProBattleMessages.hidden));add('Barras claras / oscuras',()=>{const api=window.__okayuShowdownPlusPanels;api?.setPanelTheme(api.panelTheme==='light'?'dark':'light');});}
  add('Cerrar',close);document.body.append(custom);
 }
 function schedule(){if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;sync();});}}
 function updateTimer(){if(!active||!bar)return;const room=PS.rooms[active],root=document.getElementById('room-'+active),button=bar.querySelector('[data-okayu-timer]');if(!room||!button)return;const running=!!room.battle.kickingInactive,native=root?.querySelector('[data-href="battletimer"]');let text='—';if(running){const remaining=room.battle.kickingInactive;text=typeof remaining==='number'?Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0'):'ON';const raw=native?.textContent.trim().split('|')[0].trim();if(raw&&/\d/.test(raw))text=raw;}const label=button.querySelector('span');if(label.textContent!==text)label.textContent=text;button.setAttribute('aria-pressed',String(running));button.disabled=!room.side||room.battle.ended;button.setAttribute('aria-label',(running?'Detener':'Activar')+' temporizador'+(running?': '+text:''));button.title=button.getAttribute('aria-label');}
 function sync(){if(!window.PS?.rooms)return;html.toggleAttribute('data-okayu-modal',!!PS.popups.length);window.okayuAndroidOptions?.syncNative();window.okayuMoveEffectiveness?.install();window.okayuBackgrounds?.install();
  if(!patched&&window.BattlePanel?.prototype){BattlePanel.prototype.chooseLayout=function(){return {layout:'side-by-side',battleHeight:360,battleWidth:640,overlayControls:false};};patched=true;}
  const selected=[PS.room,PS.panel,PS.leftPanel].map(r=>r?.id).find(id=>id?.startsWith('battle-'));
  const next=selected&&PS.rooms[selected]?.battle?selected:null;
  if(next!==active){document.querySelector('.okayu-active-battle')?.classList.remove('okayu-active-battle');window.okayuNarration?.clear();roomSubscription?.unsubscribe();active=next;roomSubscription=active?PS.rooms[active]?.subscribe(schedule):null;menu="main";requestSeen=null;close();}
  html.classList.toggle('okayu-battle',!!active);bar.hidden=!active;
  if(!active){clearInterval(timerTick);timerTick=0;delete html.dataset.okayuViewing;window.okayuTeamPanel?.clear();menuNode.hidden=true;backNode.hidden=true;return;}const root=document.getElementById('room-'+active);root?.classList.add('okayu-active-battle');document.querySelector('[data-okayu-calc-host]')?.removeAttribute('data-okayu-calc-host');const calcId=PS.rooms[active]?.battle?.calcdexRoomId;if(calcId)document.getElementById('room-'+calcId)?.setAttribute('data-okayu-calc-host','true');
  const editing=document.activeElement?.matches('textarea,input,[contenteditable=true]');if(!editing||innerWidth!==stableWidth){stableHeight=innerHeight;stableWidth=innerWidth;}const r=okayuAndroidLayout(innerWidth,editing?Math.max(stableHeight,innerHeight):innerHeight,0);for(const [key,value] of Object.entries({'--okayu-actions':r.actions+'px','--okayu-battle-width':r.battleWidth+'px','--okayu-battle-top':r.top+'px','--okayu-scale':r.scale,'--okayu-stage-left':r.left+'px','--okayu-stage-height':r.battleHeight+'px','--okayu-view-width':innerWidth+'px','--okayu-view-height':(editing?Math.max(stableHeight,innerHeight):innerHeight)+'px'}))if(html.style.getPropertyValue(key)!==String(value))html.style.setProperty(key,value);
  window.__showdownProBattleMessages?.attach(root);window.__okayuShowdownPlusPanels?.attach(root);
  const room=PS.rooms[active],request=room.request;html.dataset.okayuViewing=String(!room.side||(!room.battle.ended&&!!root.querySelector('[data-cmd="/ffto -1"]')));if(!timerTick)timerTick=setInterval(updateTimer,1000);updateTimer();window.okayuBattlePerspective?.refresh(root,room,r);window.okayuBackgrounds?.apply(room.battle.scene);
  // Preact reuses native buttons across menus. Remove presentation belonging to
  // the previous role before styling the current one; never change commands.
  for(const button of root.querySelectorAll('.battle-controls button')){
   if(!button.dataset.cmd?.startsWith('/switch ')){
    if(button.hasAttribute('data-okayu-team-state')){delete button.dataset.okayuTeamState;button.removeAttribute('aria-description');button.removeAttribute('aria-pressed');}
    button.classList.remove('okayu-team-selected');button.querySelector('.okayu-team-health')?.remove();
   }
   if(!button.dataset.cmd?.startsWith('/target '))delete button.dataset.okayuOwner;
  }
  if(request!==requestSeen){requestSeen=request;menu='main';if(panel)bar.dataset.attention='true';}
  for(const card of root.querySelectorAll('.switchmenu [data-cmd^="/switch "]')){const index=Number(card.dataset.cmd.split(' ')[1])-1,pokemon=request?.side?.pokemon?.[index];if(!pokemon)continue;const state=pokemon.fainted?'fainted':pokemon.active?'active':'bench';if(card.dataset.okayuTeamState!==state){card.dataset.okayuTeamState=state;card.setAttribute('aria-description',state==='fainted'?'Pokémon debilitado':state==='active'?'Pokémon activo':'');}}
  let phase=menu;
  if(!room.side)phase='spectator';else if(room.battle.ended)phase='ended';
  else if(!room.battle.atQueueEnd&&!room.battle.paused)phase='animation';
  else if(!request||request.requestType==='wait'||room.choices?.isDone())phase='wait';
  else if(request.requestType==='switch'||request.forceSwitch)phase='forced';
  else if(request.requestType==='team')phase='team';
  else if(room.choices?.current?.move)phase='target';
  if(['moves','pokemon','target','forced','team'].includes(phase))window.okayuNarration?.clear();html.dataset.okayuMenu=phase;window.okayuTeamPanel?.sync(root,room,phase);
  if(phase==='target')for(const button of root.querySelectorAll('.switchmenu button')){const args=(button.dataset.tooltip||'').split('|');const side=args[1]==='1'?room.battle.farSide:room.battle.nearSide;button.dataset.okayuOwner=side.name||'';}
menuNode.hidden=phase!=='main'||!!panel;backNode.hidden=!['moves','pokemon','target'].includes(phase)||!!panel;

 }
 function goBackMenu(){if(html.dataset.okayuMenu==='target'){const root=document.getElementById('room-'+active);root?.querySelector('[data-cmd="/cancelone"],[data-cmd="/back"]')?.click();}menu='main';schedule();}
 function start(){bar=document.createElement('nav');bar.id='okayu-toolbar';bar.setAttribute('aria-label','Utilidades de combate');for(const [name,icon,label] of [['calc','fa-calculator','Calcdex'],['log','fa-commenting-o','Log y chat'],['hub','fa-home','Battle Hub'],['rooms','fa-th-large','Salas'],['options','fa-cog','Opciones'],['timer','fa-clock-o','Temporizador']]){const b=document.createElement('button');const glyph=document.createElement('i');glyph.className='fa '+icon;glyph.setAttribute('aria-hidden','true');b.append(glyph);b.title=label;b.setAttribute('aria-label',label);b.onclick=event=>{event.preventDefault();event.stopPropagation();if(name==='timer'){const room=PS.rooms[active];if(room?.side&&!room.battle.ended)room.send(room.battle.kickingInactive?'/timer stop':'/timer start');}else open(name);};if(name==='timer'){b.dataset.okayuTimer='true';const value=document.createElement('span');value.textContent='—';b.append(value);}bar.append(b);}document.body.append(bar);bar.hidden=true;
  menuNode=document.createElement('nav');menuNode.id='okayu-combat-menu';menuNode.setAttribute('aria-label','Acciones de combate');
  for(const [label,icon,action] of [['Luchar','fa-bolt',()=>{menu='moves';schedule();}],['Pokémon','fa-circle-o',()=>{menu='pokemon';schedule();}],['Calcdex','fa-calculator',()=>open('calc')],['Chat','fa-commenting-o',()=>open('log')],['Huir','fa-sign-out',event=>PS.rooms[active]?.interruptClose(true,event.currentTarget)]]){const b=document.createElement('button');b.type='button';const i=document.createElement('i');i.className='fa '+icon;i.setAttribute('aria-hidden','true');const text=document.createElement('span');text.textContent=label;b.append(i,text);b.onclick=event=>{event.preventDefault();event.stopPropagation();action(event);};menuNode.append(b);}document.body.append(menuNode);menuNode.hidden=true;
  backNode=document.createElement('button');backNode.id='okayu-context-back';backNode.textContent='← Volver';backNode.onclick=()=>goBackMenu();document.body.append(backNode);backNode.hidden=true;

  document.addEventListener('click',event=>{if(panel==='calc'&&event.target.closest?.('[data-pro-calc="overlay-close"]')){queueMicrotask(()=>close(false));}},true);
  utilityBack=document.createElement('button');utilityBack.id='okayu-utility-back';utilityBack.textContent='← Volver';utilityBack.hidden=true;utilityBack.onclick=event=>{event.preventDefault();event.stopPropagation();if(panel==='credits')open('options');else close();};document.body.append(utilityBack);
  new MutationObserver(schedule).observe(document.getElementById('ps-frame')||document.body,{subtree:true,childList:true});addEventListener('resize',schedule);PS?.subscribe?.(schedule);schedule();
 }
 window.okayuAndroid={back(){if(window.BattleTooltips?.elem){BattleTooltips.hideTooltip();return true;}const dialog=document.querySelector('dialog[open]');if(dialog){dialog.close();return true;}if(window.PS?.popups?.length){PS.closePopup();return true;}if(panel){if(panel==='credits')open('options');else close();return true;}if(["moves","pokemon","target"].includes(html.dataset.okayuMenu)){goBackMenu();return true;}if(html.dataset.okayuMenu==="forced"||html.dataset.okayuMenu==="team")return true;if(active){PS.focusRoom('');schedule();return true;}return false;},open,sync};
 if(window.PS)start();else addEventListener('load',start,{once:true});
})();
