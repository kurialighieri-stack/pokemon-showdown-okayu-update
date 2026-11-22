(()=>{
 if(window.__okayuShowdownPlusPanels)return;
 const panelKey='okayuShowdownPlusPanelTheme';
 let panelTheme=null;try{const value=localStorage.getItem(panelKey);if(['light','dark'].includes(value))panelTheme=value;}catch{}
 const currentPanelTheme=()=>panelTheme||(document.body?.classList.contains('dark')?'dark':'light');
 const icons={light:['solrock.png','8 4 25 26',40,30],dark:['lunatone.png','12 7 17 23',40,30]};
 function icon(button,name){if(button.dataset.icon===name)return;button.dataset.icon=name;const [file,view,width,height]=icons[name],ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),image=document.createElementNS(ns,'image');svg.setAttribute('viewBox',view);svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');svg.classList.add('okayu-control-sprite');image.setAttribute('width',String(width));image.setAttribute('height',String(height));image.setAttribute('href','showdown-pro://assets/icons/controls/'+file);svg.append(image);button.replaceChildren(svg);}
 function setPanelTheme(value){if(!['light','dark'].includes(value))return;panelTheme=value;try{localStorage.setItem(panelKey,value);}catch{}paint();}
 function paint(){
  const theme=currentPanelTheme();if(document.documentElement.dataset.okayuBattlePanels!==theme)document.documentElement.dataset.okayuBattlePanels=theme;
  const es=window.Dex?.text?.getLanguage?.()==='es';
  for(const button of document.querySelectorAll('.pro-battle-panels-theme-toggle')){icon(button,theme);const action=es?(theme==='light'?'Usar barras y banners oscuros':'Usar barras y banners claros'):(theme==='light'?'Use dark party bars and banners':'Use light party bars and banners');button.title=action;button.setAttribute('aria-label',action);button.setAttribute('aria-pressed',String(theme==='dark'));}
 }
 function attach(root){const controls=root?.querySelector('.battle-controls');if(!controls)return;let wrapper=controls.querySelector('.pro-battle-messages-controls');if(!wrapper){wrapper=document.createElement('div');wrapper.className='pro-battle-messages-controls';wrapper.dataset.docked='false';controls.append(wrapper);}if(!wrapper.querySelector('.pro-battle-panels-theme-toggle')){const panels=document.createElement('button');panels.type='button';panels.className='button pro-battle-panels-theme-toggle';panels.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();setPanelTheme(currentPanelTheme()==='light'?'dark':'light');});wrapper.append(panels);}paint();}
 window.addEventListener('storage',event=>{if(event.key===panelKey){panelTheme=['light','dark'].includes(event.newValue)?event.newValue:null;paint();}});
 window.PS?.prefs?.subscribe?.(name=>{if(!name||['language','serversettings','theme'].includes(name))paint();});
 window.__okayuShowdownPlusPanels={attach,setPanelTheme,get panelTheme(){return currentPanelTheme();}};paint();
})();
