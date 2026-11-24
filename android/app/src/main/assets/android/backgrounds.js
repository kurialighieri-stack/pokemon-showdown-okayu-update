/* Round-robin per new battle; stored assignments keep replays consistent. */
(function(root){
 const files=['battle-stadium.png','final-stadium.png','new-save.png'],key='okayu.backgrounds.v1';
 function stable(id){let n=0;for(const c of id)n=(n*31+c.charCodeAt(0))%files.length;return n;}
 function rotation(storage){let state={next:0,battles:{}};try{const saved=JSON.parse(storage.getItem(key));if(saved&&Number.isInteger(saved.next)&&saved.next>=0&&saved.next<3&&saved.battles&&typeof saved.battles==='object'&&!Array.isArray(saved.battles)){state.next=saved.next;for(const [id,index] of Object.entries(saved.battles))if(/^battle-[a-z0-9-]+-\d+$/.test(id)&&Number.isInteger(index)&&index>=0&&index<3)state.battles[id]=index;}}catch{}
  return id=>{id=String(id||'');if(!/^battle-[a-z0-9-]+-\d+$/.test(id))return files[stable(id)];if(Object.prototype.hasOwnProperty.call(state.battles,id))return files[state.battles[id]];const index=state.next,next={next:(index+1)%3,battles:{...state.battles,[id]:index}};try{storage.setItem(key,JSON.stringify(next));state=next;return files[index];}catch{const fallback=stable(id);state.battles[id]=fallback;return files[fallback];}};
 }
 if(typeof module==='object'&&module.exports)module.exports={files,rotation};
 if(!root?.document)return;
 let storage;try{storage=root.localStorage;}catch{}const choose=rotation(storage||{getItem(){},setItem(){throw Error('Storage unavailable');}});
 function apply(scene){if(!scene?.backdropImage?.startsWith('sprites/gen6bgs/')||!scene.$bg?.[0])return;const name=choose(scene.battle.id),bg=scene.$bg[0];if(bg.dataset.okayuBackground===name)return;bg.style.backgroundImage='url("'+new URL('/plus/bg/'+name,location.origin).href+'")';bg.dataset.okayuBackground=name;}
 function install(){const proto=root.BattleScene?.prototype;if(!proto||proto.__okayuBackgrounds)return;proto.__okayuBackgrounds=true;const original=proto.updateGen;proto.updateGen=function(...args){const result=original.apply(this,args);if(this.$bg?.[0])delete this.$bg[0].dataset.okayuBackground;apply(this);return result;};}
 root.okayuBackgrounds={files,choose,apply,install};install();
})(typeof window==='undefined'?null:window);
