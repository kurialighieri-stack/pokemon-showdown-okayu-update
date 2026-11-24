/* Original color palettes inspired by the requested characters; no third-party artwork. */
(()=>{
 const palettes={
  okayu:{name:'Okayu',bg:'#211d2c',panel:'#352c43',raised:'#483953',border:'#725c8c',accent:'#f18abf',text:'#f6e8f1',muted:'#c9b7d1',banner:'#8d709f',paper:'#eee8f3'},
  gura:{name:'Gura',bg:'#122333',panel:'#1c384e',raised:'#294e68',border:'#629dc1',accent:'#8ed8f4',text:'#edf9ff',muted:'#b3cfdf',banner:'#358bbd',paper:'#e8f5fc'},
  raora:{name:'Raora',bg:'#2b1928',panel:'#47283f',raised:'#603750',border:'#bb7297',accent:'#ffa9d2',text:'#fff0f7',muted:'#e5b8cf',banner:'#d65c99',paper:'#fff0f7'},
  cecilia:{name:'Ceci',bg:'#152820',panel:'#243f32',raised:'#355642',border:'#6b9e7a',accent:'#b8df9a',text:'#f0f8e9',muted:'#bad0b4',banner:'#4b926b',paper:'#eef5e8'},
  baelz:{name:'Bae',bg:'#21191d',panel:'#3b252a',raised:'#53333a',border:'#b25563',accent:'#ff8b8b',text:'#fff0ee',muted:'#dfb6b9',banner:'#d2394e',paper:'#fff0ec'},
  amelia:{name:'Amelia',bg:'#2b241b',panel:'#42382a',raised:'#5b4a35',border:'#a58a5a',accent:'#f1ce76',text:'#fff6df',muted:'#d7c6a4',banner:'#b48b43',paper:'#faf1db'},
 };
 const entries=Object.entries(palettes).map(([key,p])=>[key,p.name]);
 function sync(){const key=PS.prefs.theme,p=palettes[key]||palettes.gura,root=document.documentElement;root.dataset.okayuTheme=palettes[key]?key:key==='pro'?'gura':key;
  for(const role of ['bg','panel','raised','border','accent','text','muted']){root.style.setProperty('--pro-color-'+role,p[role]);const h=p[role];root.style.setProperty('--pro-color-'+role+'-rgb',[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)).join(','));}
  root.style.setProperty('--pro-color-ink',p.bg);root.style.setProperty('--pro-color-shadow',p.bg);for(const role of ['ink','shadow'])root.style.setProperty('--pro-color-'+role+'-rgb',[1,3,5].map(i=>parseInt(p.bg.slice(i,i+2),16)).join(','));
  root.style.setProperty('--okayu-theme-accent',p.accent);root.style.setProperty('--okayu-theme-banner',p.banner);root.style.setProperty('--okayu-theme-paper',p.paper);root.style.setProperty('--okayu-theme-ink',p.bg);for(const [role,hex] of [['paper',p.paper],['banner',p.banner],['ink',p.bg]])root.style.setProperty('--okayu-theme-'+role+'-rgb',[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).join(','));
 }
 window.okayuThemes={entries,palettes,sync};
 function start(){if(!window.PS?.prefs){setTimeout(start,50);return;}if(PS.prefs.theme==='pro')PS.prefs.set('theme','gura');PS.prefs.subscribe(key=>{if(!key||key==='theme')sync();});sync();}start();
})();
