// This function is embedded into Showdex at build time. Only presentation
// resources are written; the Dex, presets and calculator inputs stay canonical.
function installShowdownLanguages(i18n, spanish, host = globalThis) {
  if (host.__showdownProLanguage) return host.__showdownProLanguage;
  const dex = host.Dex;
  const clone = value => JSON.parse(JSON.stringify(value));
  const english = Object.fromEntries(i18n.options.ns.map(ns => [ns, clone(i18n.getResourceBundle('en', ns) || {})]));
  const languages = dex?.text?.languages?.() || [{code:'en',fullName:'English'}];
  const supported = [...new Set(['en', ...languages.map(l => l.code).filter(Boolean)])];
  const normalize = language => {
    const code = dex?.text?.findLanguage?.(language)?.code || String(language || 'en').toLowerCase();
    return supported.includes(code) ? code : 'en';
  };
  const current = () => normalize(dex?.text?.getLanguage?.() || 'en');
  const dictionaries = () => host.BattleText || {};
  const translated = (text, language) => {
    if (typeof text !== 'string' || !text || text.includes('$t(') || text.includes('{{')) return text;
    return host.TL?.inLanguage?.(text, language) || text;
  };
  const walk = (value, language) => {
    if (Array.isArray(value)) return value.map(v => walk(v, language));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,k==='--meta'?v:walk(v,language)]));
    return translated(value, language);
  };
  const setPath = (root, path, value) => {
    const keys=path.split('.');let node=root;
    for(const key of keys.slice(0,-1))node=node[key] ||= {};
    node[keys.at(-1)]=value;
  };
  const built = new Map();
  function resources(language) {
    const texts = dictionaries()[language];
    if (built.has(language) && built.get(language) === texts) return;
    const data = Object.fromEntries(Object.keys(english).map(ns => [ns,
      i18n.hasResourceBundle(language,ns)&&language!=='en' ? clone(i18n.getResourceBundle(language,ns)) : walk(english[ns],language)]));
    if(language==='es')for(const [key,value] of Object.entries(spanish))setPath(data,key,value);
    const pokemon=data.pokedex ||= {};
    // Data lookup uses the same IDs as Showdown. Localized names are labels only.
    const groups=[['moves','BattleMovedex','moves'],['abilities','BattleAbilities','abilities'],['items','BattleItems','items'],['species','BattlePokedex','species']];
    for(const [group,table,accessor] of groups){
      pokemon[group] ||= {};
      for(const id of Object.keys(host[table]||{})){
        const effect=dex?.[accessor]?.get(id);
        if(!effect?.exists)continue;
        const text=dex.text?.get?.(effect,language);
        pokemon[group][id]=text?.name || effect.name;
      }
    }
    // Aliases also participate in translated dropdown searches.
    for(const [group,alias] of [['moves','moveAliases'],['abilities','abilityAliases'],['items','itemAliases'],['species','speciesAliases']]){
      for(const [id,name] of Object.entries(english.pokedex?.[alias]||{})){
        const canonical=String(name).toLowerCase().replace(/[^a-z0-9]/g,'');
        (pokemon[alias] ||= {})[id]=pokemon[group]?.[canonical]||name;
      }
    }
    const native=texts||dictionaries().en||{};
    for(const [id,values] of Object.entries(english.pokedex?.types||{})){
      const name=native.TypeNames?.[values[0]];
      if(name){const upper=Array.from(name.toLocaleUpperCase());pokemon.types[id]=[name,...[6,4,3].map(length=>upper.slice(0,length).join(''))];}
    }
    for(const [id,name] of Object.entries(english.pokedex?.natures||{}))pokemon.natures[id]=native.NatureNames?.[name]||name;
    for(const [id,values] of Object.entries(english.pokedex?.stats||{})){
      const key=id==='acc'?'accuracy':id==='eva'?'evasion':id;
      if(native.StatNames?.[key])pokemon.stats[id]=[native.StatNames[key],native.StatShortNames?.[key]||values[1]];
    }
    for(const [id,values] of Object.entries(english.pokedex?.nonvolatiles||{})){
      const name=native.StatusNames?.[id];
      if(name)pokemon.nonvolatiles[id]=[name,name.toLocaleUpperCase(),values[2]];
    }
    for(const [ns,value] of Object.entries(data))i18n.addResourceBundle(language,ns,value,true,true);
    built.set(language,texts);
  }
  for(const options of [i18n.options,i18n.services.languageUtils.options]){
    options.supportedLngs=supported;
    options.lowerCaseLng=true;
    options.fallbackLng=['en'];
  }
  i18n.services.languageUtils.supportedLngs=supported;
  let sequence=0,pending=null,pendingLanguage=null,destroyed=false;
  async function synchronize(language,token){
    try{await dex?.loadTextData?.(language);}catch(error){console.warn('Showdex language data:',language,error.message);}
    if(destroyed||token!==sequence)return;
    resources(language);
    if(i18n.language!==language)await i18n.changeLanguage(language);
    host.document?.documentElement?.setAttribute('data-showdex-language',language);
  }
  function sync(){
    const language=current();
    if(pending&&pendingLanguage===language)return pending;
    pendingLanguage=language;
    const token=++sequence;
    const task=synchronize(language,token);
    pending=task;
    task.finally(()=>{if(pending===task)pending=null;});
    return task;
  }
  const subscription=host.PS?.prefs?.subscribe?.(key=>{
    if(!key||key==='language'||key==='serversettings')void sync();
  });
  // Classic client writes preferences through Storage instead of PS.prefs.
  let originalPrefs,wrappedPrefs;
  if(!host.PS&&typeof host.Storage?.prefs==='function'){
    originalPrefs=host.Storage.prefs;
    wrappedPrefs=Object.assign(function(...args){const result=originalPrefs.apply(this,args);if(args.length>1&&['language','serversettings'].includes(args[0]))void sync();return result;},originalPrefs);
    host.Storage.prefs=wrappedPrefs;
  }
  const bridge={
    supported: [...supported],
    sync,
    get language(){return i18n.language;},
    get following(){return current();},
    t:(key,options)=>i18n.t(key,options),
    describe(localDex,...effects){
      for(const effect of effects.filter(Boolean)){
        let text;
        try{text=localDex?.text?.get?.(effect,current())||dex?.text?.get?.(effect,current());}catch{}
        const description=text?.shortDesc||text?.desc||effect.shortDesc||effect.desc;
        if(description)return description;
      }
      return '';
    },
    destroy(){destroyed=true;sequence++;subscription?.unsubscribe?.();if(originalPrefs&&host.Storage.prefs===wrappedPrefs)host.Storage.prefs=originalPrefs;delete host.__showdownProLanguage;},
  };
  host.__showdownProLanguage=bridge;
  bridge.ready=sync();
  return bridge;
}
module.exports={installShowdownLanguages};
