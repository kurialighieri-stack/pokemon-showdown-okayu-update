(()=>{
 if(document.getElementById('okayu-glass-card'))return;
 const list=document.getElementById('addons-list');if(!list)return;
 const card=document.createElement('div');card.id='okayu-glass-card';card.className='addon-card';
 card.innerHTML=`<label class="setting-row" for="okayu-glass-enabled"><span><strong>Glass para Linux · experimental</strong><small>Superficies translúcidas para Pro y Okayu</small></span><input id="okayu-glass-enabled" type="checkbox"></label>
 <label class="setting-row" for="okayu-glass-system"><span>Usar configuración del sistema</span><input id="okayu-glass-system" type="checkbox"></label>
 <label class="okayu-glass-slider" for="okayu-glass-transparency">Transparencia <output id="okayu-glass-transparency-value"></output><input id="okayu-glass-transparency" type="range" min="0" max="95" step="1"></label>
 <label class="okayu-glass-slider" for="okayu-glass-blur">Blur interno <output id="okayu-glass-blur-value"></output><input id="okayu-glass-blur" type="range" min="0" max="24" step="1"></label>
 <p class="helper" id="okayu-glass-status" aria-live="polite"></p><p class="helper">Blur interno desenfoca capas de la app. El desenfoque real del escritorio depende del compositor y su intensidad pertenece al sistema. Puede aumentar el uso de GPU.</p>`;
 list.before(card);const get=id=>document.getElementById('okayu-glass-'+id);let current,dirty=false,busy=false,timer;
 function render(state){if(!state?.okayuGlass)return;current=state.okayuGlass;const {settings,system,effective,backend}=current;
  get('enabled').checked=settings.enabled;get('system').checked=settings.useSystem&&system.available;
  get('system').disabled=!system.available;get('system').title=system.available?'Preferencias COSMIC, solo lectura':'Este escritorio no publica ajustes de vidrio compatibles. Usa los controles manuales.';
  if(!dirty&&!busy){get('transparency').value=Math.round((1-effective.opacity)*100);get('blur').value=effective.blur;}
  const locked=!settings.enabled||settings.useSystem&&system.available;
  get('transparency').disabled=locked;get('blur').disabled=!settings.enabled||settings.useSystem&&system.available;
  get('transparency-value').textContent=get('transparency').value+' %';get('blur-value').textContent=get('blur').value+' px';
  get('status').textContent=(settings.enabled&&!effective.active?'Inactivo en este tema o desactivado por el sistema. ':'')+(effective.inherited?'COSMIC: blur '+system.blur+'. ':settings.useSystem&&!system.available?'Sin preferencias de vidrio del sistema; usa valores manuales. ':'')+backend.message;
 }
 async function save(){if(!current)return;dirty=false;busy=true;try{const settings={...current.settings,enabled:get('enabled').checked,useSystem:get('system').checked&&current.system.available,opacity:1-Number(get('transparency').value)/100,blur:Number(get('blur').value)};render(await window.pro.setSetting('okayuGlass',settings));}catch(error){get('status').textContent=error.message;}finally{busy=false;render(await window.pro.getState());}}
 for(const id of ['transparency','blur']){
  get(id).oninput=()=>{dirty=true;get(id+'-value').textContent=get(id).value+(id==='blur'?' px':' %');clearTimeout(timer);timer=setTimeout(()=>void save(),160);};
  get(id).onchange=()=>{clearTimeout(timer);void save();};
 }
 for(const id of ['enabled','system'])get(id).onchange=()=>{clearTimeout(timer);void save();};
 window.pro.onState(render);window.pro.getState().then(render);
})();
