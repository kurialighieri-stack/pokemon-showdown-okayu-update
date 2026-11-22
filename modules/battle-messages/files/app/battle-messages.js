// Presentation only: leave battle messages, animation queues and the log intact.
(() => {
 if(window.__showdownProBattleMessages)return true;
 const key='showdownProBattleMessagesHidden';
 const icons={unown:['unown.png','37 29 22 38',96,96],shiny:['unown-shiny.png','37 29 22 38',96,96]};
 function icon(button,name){if(button.dataset.icon===name)return;button.dataset.icon=name;const [file,view,width,height]=icons[name],ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),image=document.createElementNS(ns,'image');svg.setAttribute('viewBox',view);svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');svg.classList.add('okayu-control-sprite');image.setAttribute('width',String(width));image.setAttribute('height',String(height));image.setAttribute('href','showdown-pro://assets/icons/controls/'+file);svg.append(image);button.replaceChildren(svg);}
 let hidden=false;
 try{hidden=localStorage.getItem(key)==='true';}catch{}
 const labels=()=>{
  const es=window.Dex?.text?.getLanguage?.()==='es';
  return es?{name:'Textos',state:hidden?'ocultos':'visibles',action:hidden?'Mostrar avisos sobre el combate':'Ocultar avisos sobre el combate'}:
   {name:'Text',state:hidden?'hidden':'visible',action:hidden?'Show battle messages':'Hide battle messages'};
 };
 function paint(){
  document.documentElement.classList.toggle('pro-hide-battle-messages',hidden);
  const l=labels();
  for(const button of document.querySelectorAll('.pro-battle-messages-toggle')){
   icon(button,hidden?'shiny':'unown');
   const label=l.name+': '+l.state+'. '+l.action;button.title=label;button.setAttribute('aria-label',label);button.setAttribute('aria-pressed',String(hidden));
  }

 }
 function setHidden(value){
  hidden=!!value;
  try{localStorage.setItem(key,String(hidden));}catch{}
  paint();
 }
 function attach(root){
  const controls=root?.querySelector('.battle-controls');
  if(!controls)return;
  let wrapper=controls.querySelector('.pro-battle-messages-controls');
  if(!wrapper){
   wrapper=document.createElement('div');wrapper.className='pro-battle-messages-controls';
   const button=document.createElement('button');button.type='button';button.className='button pro-battle-messages-toggle';
   button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();setHidden(!hidden);});
   wrapper.append(button);controls.append(wrapper);
  }
  const timer=controls.querySelector('.timerbutton,[data-href="battletimer"]');
  const docked=!!timer&&getComputedStyle(timer.parentElement).display==='flex';
  if(wrapper.dataset.docked!==String(docked))wrapper.dataset.docked=String(docked);
  if(docked){
   const previous=timer.previousElementSibling;
   const anchor=previous?.classList.contains('pro-theater-toggle')?previous:timer;
   if(wrapper.nextSibling!==anchor)anchor.before(wrapper);
  }
  else if(wrapper.parentElement!==controls)controls.append(wrapper);
  paint();
 }
 window.addEventListener('storage',event=>{if(event.key===key){hidden=event.newValue==='true';paint();}});
 window.PS?.prefs?.subscribe?.(name=>{if(!name||name==='language'||name==='serversettings'||name==='theme')paint();});
 window.__showdownProBattleMessages={attach,setHidden,get hidden(){return hidden;}};
 paint();return true;
})();
