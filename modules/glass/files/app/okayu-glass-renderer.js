/* One fixed stylesheet, no DOM scanning, paint measurement, observer or hover IPC. */
(()=>{
 if(typeof window==='undefined')return;
 if(window.__okayuGlassSurfaces)return true;
 const root=document.documentElement;
 const protectedParts=['.battle','.phd-layer','.phd-team','svg','canvas','img','video','picture','[role="img"]','.fa','.hpbar','.hp','.statbar','.status','[class*="PokeHpBar-"]','.type','[class*="type-"]','.picon','.itemicon','.pokemonicon','.trainericon','.psicon','input[type="checkbox"]','input[type="radio"]','[class*="Picon-"]','[class*="PokemonIcon-"]'];
 const excluded=protectedParts.flatMap(s=>[s,s+' *']).join(',')+',[style*="url("]';
 const scope='html[data-okayu-glass="on"]',surface=scope+' body *:where(:not('+excluded+'))';
 const menus='dialog,.ps-popup,.popup,.popupmenu,.tooltip,[role="tooltip"],.select2-drop,[role="dialog"],[role="listbox"],[data-tippy-root],.tippy-box';
 const css=`@layer okayu-glass {
 ${scope}{background:transparent !important;}
 ${scope} body{background:rgba(var(--okayu-glass-base),var(--okayu-glass-alpha)) !important;}
 ${scope}[data-okayu-glass-role="hub"] body,${scope}[data-okayu-glass-role="tooltip"] body{background:transparent !important;}
 ${surface},${surface}::before,${surface}::after{background-color:transparent !important;background-image:none !important;box-shadow:none !important;backdrop-filter:none !important;-webkit-backdrop-filter:none !important;}
 ${surface}{border-color:rgba(var(--pro-color-border-rgb,89,126,151),var(--okayu-glass-alpha)) !important;}
 ${scope}[data-okayu-glass-role="hub"] .sidebar,${scope}[data-okayu-glass-role="tooltip"] #label{background:rgba(var(--okayu-glass-base),var(--okayu-glass-alpha)) !important;}
 ${scope} body :is(${menus}){background-color:rgba(var(--okayu-glass-base),var(--okayu-glass-alpha)) !important;backdrop-filter:var(--okayu-glass-backdrop) !important;-webkit-backdrop-filter:var(--okayu-glass-backdrop) !important;}
 ${scope} :is(button:hover,[role="tab"][aria-selected="true"],[aria-pressed="true"]):not(${excluded}){background-color:rgba(var(--pro-color-accent-rgb,75,151,201),.08) !important;}
 }`;
 let previous;
 function collect(value){
  const signature=JSON.stringify([value.active,value.role,value.theme,value.opacity,value.blur]);
  if(signature!==previous){
   previous=signature;root.dataset.okayuGlass=value.active?'on':'off';root.dataset.okayuGlassRole=value.role||'client';
   root.style.setProperty('--okayu-glass-alpha',String(value.opacity));root.style.setProperty('--okayu-glass-blur',value.blur+'px');root.style.setProperty('--okayu-glass-backdrop',value.blur>0?'blur('+value.blur+'px)':'none');root.style.setProperty('--okayu-glass-base',value.theme==='okayu'?'53,44,67':'20,40,56');
  }
  window.__okayuGlassStats={runs:0,count:0,ms:0,cssBytes:css.length};
  return {css:value.active?css:'',...window.__okayuGlassStats};
 }
 window.__okayuGlassSurfaces={collect,refresh(){},dispose(){}};
 return true;
})();
