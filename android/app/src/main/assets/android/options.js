(()=>{
 if(window.okayuAndroidOptions)return;
 function mount(container,close){
  container.dataset.page='options';container.classList.add('okayu-paper-surface');container.setAttribute('aria-modal','true');container.replaceChildren();
  const title=document.createElement('h2');title.textContent='Opciones';const list=document.createElement('div');list.className='okayu-options-list';const footer=document.createElement('footer');container.append(title,list,footer);
  function row(label,input,description){const wrap=document.createElement('label');wrap.className='okayu-option-row';const name=document.createElement('span');name.textContent=label;const control=document.createElement('span');control.className='okayu-option-control';control.append(input);wrap.append(name,control);if(description)input.setAttribute('aria-description',description);list.append(wrap);return control;}
  function select(label,name,entries,value,change){const input=document.createElement('select');input.name=name;for(const [key,text] of entries){const opt=document.createElement('option');opt.value=key;opt.textContent=text;input.append(opt);}input.value=value;input.onchange=()=>change(input.value);row(label,input);}
  function toggle(label,name,value,change){const input=document.createElement('input');input.type='checkbox';input.name=name;input.checked=value;input.onchange=()=>change(input.checked);row(label,input);}
  function slider(label,name,value,min,max,change,format=v=>v+' %'){const input=document.createElement('input'),output=document.createElement('output');input.type='range';input.name=name;input.min=min;input.max=max;input.step=1;input.value=value;output.value=format(value);const control=row(label,input);control.append(output);input.oninput=()=>{const v=Number(input.value);output.value=format(v);change(v);};}
  select('Tema','theme',[...okayuThemes.entries,['light','Claro'],['dark','Oscuro'],['system','Sistema']],PS.prefs.theme,v=>PS.prefs.set('theme',v));
  const languages=window.Dex?.text?.languages?.()||[];
  select('Idioma','language',[['','Automático'],...languages.map(l=>[l.legacyId||l.code,l.fullName])],PS.prefs.serversettings.language||'',v=>{PS.prefs.set('serversettings',{...PS.prefs.serversettings,language:v||undefined});void Dex.loadTextData().then(()=>PS.updateTranslatedText());PS.send('/language '+(Dex.text.findLanguage(Dex.text.getLanguage())?.legacyId||'english'));});
  toggle('Mensajes sobre el combate','battleMessages',!window.__showdownProBattleMessages?.hidden,v=>window.__showdownProBattleMessages?.setHidden(!v));
  if(window.__okayuShowdownPlusPanels)select('Barras y banners','panels',[['light','Claros'],['dark','Oscuros']],__okayuShowdownPlusPanels.panelTheme,v=>__okayuShowdownPlusPanels.setPanelTheme(v));
  if(window.okayuNarration)slider('Velocidad del texto','narrationSpeed',40-okayuNarration.speed,0,40,v=>okayuNarration.setSpeed(40-v),v=>v===40?'Instantáneo':v>25?'Rápido':v>13?'Normal':'Lento');
  toggle('Silenciar sonido','mute',!!PS.prefs.mute,v=>PS.prefs.set('mute',v));
  for(const [name,label] of [['musicvolume','Música'],['effectvolume','Efectos de sonido'],['notifvolume','Notificaciones']])slider(label,name,PS.prefs[name],0,100,v=>PS.prefs.set(name,v));
  const credits=document.createElement('button');credits.textContent='Créditos y licencias';credits.onclick=e=>{e.preventDefault();e.stopPropagation();window.okayuAndroid.open('credits');};list.append(credits);
  const advanced=document.createElement('button');advanced.textContent='Más opciones de Showdown';advanced.onclick=e=>{e.preventDefault();e.stopPropagation();close();PS.join('options');};list.append(advanced);
  const back=document.createElement('button');back.type='button';back.textContent='← Volver';back.onclick=e=>{e.preventDefault();e.stopPropagation();close();};footer.append(back);
 }
 let nativeBack;
 function syncNative(){const visible=window.PS?.popups?.includes('options');if(!nativeBack&&visible){nativeBack=document.createElement('button');nativeBack.id='okayu-native-options-back';nativeBack.textContent='← Volver';nativeBack.onclick=e=>{e.preventDefault();e.stopPropagation();PS.closePopup();};document.body.append(nativeBack);}if(nativeBack)nativeBack.hidden=!visible;}
 window.okayuAndroidOptions={mount,syncNative};
})();
