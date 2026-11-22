// A real extension stylesheet keeps relative images/fonts anchored to ui/.
// Electron's content-script CSS transport can otherwise resolve them on the page.
(()=>{
 const id='okayu-showdown-plus-panels';
 const attach=()=>{
  const root=document.head||document.documentElement;if(!root)return false;
  const html=document.documentElement;html.dataset.okayuShowdownPlus='on';
  html.style.setProperty('--okayu-pill-light','url("'+chrome.runtime.getURL('ui/assets/pill.png')+'")');
  html.style.setProperty('--okayu-pill-dark','url("'+chrome.runtime.getURL('ui/assets/pill_dark.png')+'")');
  if(!document.getElementById(id)){const link=document.createElement('link');link.id=id;link.rel='stylesheet';link.href=chrome.runtime.getURL('ui/panels.css');root.append(link);}
  return true;
 };
 if(!attach()){const observer=new MutationObserver(()=>{if(attach())observer.disconnect();});observer.observe(document,{childList:true,subtree:true});}
})();
