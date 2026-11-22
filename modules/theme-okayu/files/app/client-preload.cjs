const { contextBridge, ipcRenderer, webFrame } = require('electron');
let themeStyleReady=Promise.resolve(false);
// Narrow client bridge: battle reports and validated Theater layout preferences.
contextBridge.exposeInMainWorld('showdownProEvents', Object.freeze({
  themeStyleReady:()=>themeStyleReady,
  searchReplays: query => ipcRenderer.invoke('client:replay-search',query),
  replayAccount: () => ipcRenderer.invoke('client:replay-account'),
  loadReplay: url => ipcRenderer.invoke('client:replay-load',url),
  getTheaterLayout: () => ipcRenderer.invoke('client:theater-layout'),
  setTheaterLayout: value => ipcRenderer.invoke('client:theater-layout',value),
  setTheaterActive: roomId => ipcRenderer.send('client:theater-active',roomId),
  receive: data => { if (typeof data === 'string' && data.length <= 8 * 1024 * 1024) ipcRenderer.send('client:receive', data); },
  sent: (room, command) => { if (typeof room === 'string' && typeof command === 'string' && command.length < 512) ipcRenderer.send('client:sent', room, command); },
}));

// Seed the shared preference before either client reads it, then paint Pro
// without waiting for executeJavaScript's page-load gate or a socket connection.
if (location.origin === 'https://play.pokemonshowdown.com' && window.top === window) {
  let zoomState;
  const applyZoom = value => {
    if(value)zoomState=value;
    if(!zoomState || !document.documentElement)return;
    // Compensate for page zoom so Showdex keeps its own absolute percentage.
    document.documentElement.style.setProperty('--showdown-pro-showdex-zoom',String(zoomState.showdexZoomPercent/zoomState.clientZoomPercent));
    window.dispatchEvent(new Event('resize'));
  };
  ipcRenderer.on('client:zoom-state',(_event,value)=>applyZoom(value));
  ipcRenderer.invoke('client:zoom-state').then(value=>{
    if(!value)return;
    webFrame.insertCSS(value.css,{cssOrigin:'user'});
    // A load notification may already contain a newer setting.
    applyZoom(zoomState||value);
  }).catch(error=>console.error('Client zoom:',error.message));
  const zoomObserver=new MutationObserver(()=>{
    if(document.documentElement){applyZoom();zoomObserver.disconnect();}
  });
  zoomObserver.observe(document,{childList:true,subtree:true});
  const zoomTarget = event => event.target?.closest?.('[data-showdex-module], [class*="Tooltip-module-container-"]') ? 'showdex' : 'showdown';
  for(const type of ['pointerdown','focusin'])window.addEventListener(type,event=>{
    if(event.isTrusted)ipcRenderer.send('client:zoom-target',zoomTarget(event));
  },{capture:true});
  // Handle only real Ctrl+wheel input in this isolated preload. Cancel native
  // wheel zoom so it cannot drift away from Pro's saved percentage.
  window.addEventListener('wheel',event=>{
    if(!event.isTrusted || !event.ctrlKey || !event.deltaY)return;
    event.preventDefault();
    ipcRenderer.send('client:zoom',event.deltaY<0?'in':'out',zoomTarget(event));
  },{capture:true,passive:false});
  let choice = 'pro';
  try {
    const value = JSON.parse(localStorage.getItem('showdown_prefs') || '{}');
    const prefs = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    if(!prefs.okayuDefaultThemeVersion){prefs.theme='okayu';prefs.okayuDefaultThemeVersion=1;}
    if (!prefs.showdownProThemeVersion) {
      if (!prefs.theme || prefs.theme === 'dark') prefs.theme = 'pro';
      prefs.showdownProThemeVersion = 1;
    }
    if (!['light', 'dark', 'pro', 'okayu', 'system'].includes(prefs.theme)) prefs.theme = 'pro';
    choice = prefs.theme;
    localStorage.setItem('showdown_prefs', JSON.stringify(prefs));
  } catch { /* Storage may be unavailable; keep the first-run Pro appearance. */ }
  const system = matchMedia('(prefers-color-scheme: dark)');
  const apply = () => {
    const root = document.documentElement;
    if (!root) return;
    if (root.dataset.showdownProThemeReady) { observer.disconnect(); return; }
    const okayu = choice === 'okayu';
    const pro = okayu || choice === 'pro';
    const dark = pro || choice === 'dark' || choice === 'system' && system.matches;
    root.classList.toggle('showdown-pro', pro);
    root.classList.toggle('showdown-okayu', okayu);
    root.classList.toggle('dark', dark);
    const newClient = location.pathname === '/newclient' || !!document.querySelector('link[href*="/style/client2.css"]');
    if (newClient && !root.classList.contains('showdown-new-client')) root.classList.add('showdown-new-client');
    if (newClient) document.body?.classList.toggle('dark', dark);
  };
  const observer = new MutationObserver(records => {
    if (records.some(record => record.type === 'childList' ||
        record.target === document.documentElement || record.target === document.body)) apply();
  });
  observer.observe(document, { childList: true, subtree: true, attributes: true,
    attributeFilter: ['class', 'data-showdown-pro-theme-ready'] });
  apply();
  themeStyleReady=ipcRenderer.invoke('client:theme-css').then(css => {
    if(typeof css!=='string')return false;
    // Parse once with Chromium: keep author layout priority and user !important
    // overrides, with every declaration installed at just one origin.
    if(/@import\s/i.test(css))throw Error('Imported theme CSS requires the compatibility fallback');
    const source=new CSSStyleSheet();source.replaceSync(css);
    const header=text=>{let quote='';for(let i=0;i<text.length;i++){const c=text[i];if(c==='\\'){i++;continue;}if(quote){if(c===quote)quote='';}else if(c==='"'||c==="'")quote=c;else if(c==='{')return text.slice(0,i);}return '';};
    function declarations(text){
      let n='',p='',begin=0,quote='',depth=0,comment=false;
      const emit=end=>{const declaration=text.slice(begin,end).trim();if(declaration){if(/!important\s*$/i.test(declaration))p+=declaration+';';else n+=declaration+';'}begin=end+1;};
      for(let i=0;i<text.length;i++){
        const c=text[i],next=text[i+1];
        if(comment){if(c==='*'&&next==='/'){comment=false;i++;}continue;}
        if(c==='\\'){i++;continue;}
        if(quote){if(c===quote)quote='';continue;}
        if(c==='/'&&next==='*'){comment=true;i++;continue;}
        if(c==='"'||c==="'"){quote=c;continue;}
        if('([{'.includes(c))depth++;else if(')]}'.includes(c))depth--;
        if(c===';'&&depth===0)emit(i);
      }
      emit(text.length);return {normal:n,important:p};
    }
    function split(rules){
      let normal='',important='';
      for(const rule of rules){
        let n='',p='';
        if(rule.style){const declaration=declarations(rule.style.cssText);n=declaration.normal;p=declaration.important;}
        if(rule.cssRules){const nested=split(rule.cssRules);n+=nested.normal;p+=nested.important;}
        const head=rule.selectorText??rule.keyText??header(rule.cssText);
        if(rule.style||rule.cssRules){if(n)normal+=head?head+'{'+n+'}':n;if(p)important+=head?head+'{'+p+'}':p;}
        else {normal+=rule.cssText;if(rule.cssText.startsWith('@layer '))important+=rule.cssText;}
      }
      return {normal,important};
    }
    const styles=split(source.cssRules);
    if(styles.normal)webFrame.insertCSS(styles.normal,{cssOrigin:'author'});
    if(styles.important)webFrame.insertCSS(styles.important,{cssOrigin:'user'});
    return true;
  }).catch(error=>{console.error('Pro startup styling:',error.message);return false;});
}

// Follow the theme Showdown actually renders, including its System setting.
// Classic uses html.dark; the newer client uses body.dark.
window.addEventListener('DOMContentLoaded', () => {
  let previous;
  const syncTheme = () => {
    const theme = document.documentElement.classList.contains('showdown-okayu') ? 'okayu' : document.documentElement.classList.contains('showdown-pro') ? 'pro' : document.documentElement.classList.contains('dark') || document.body?.classList.contains('dark') ? 'dark' : 'light';
    if (theme === previous) return;
    previous = theme;
    ipcRenderer.send('client:theme', theme);
  };
  const observer = new MutationObserver(syncTheme);
  for (const element of [document.documentElement, document.body]) {
    if (element) observer.observe(element, { attributes: true, attributeFilter: ['class'] });
  }
  syncTheme();
}, { once: true });
