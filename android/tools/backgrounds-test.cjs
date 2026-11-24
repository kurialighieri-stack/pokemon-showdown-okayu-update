const assert=require('node:assert/strict'),{files,rotation}=require('../app/src/main/assets/android/backgrounds.js');
const memory={value:null,getItem(){return this.value},setItem(k,v){this.value=v}};
const choose=rotation(memory),ids=Array.from({length:9},(_,i)=>'battle-gen9randombattle-'+(100+i));
assert.deepEqual(ids.map(choose),[...files,...files,...files]);assert.equal(choose(ids[0]),files[0]);
const reopen=rotation(memory);for(let i=0;i<ids.length;i++)assert.equal(reopen(ids[i]),files[i%3]);assert.equal(reopen('battle-gen9doubles-500'),files[0]);
for(const bad of ['not-json','null','{"next":999,"battles":{}}','{"next":0,"battles":[]}']){const storage={getItem(){return bad},setItem(){}};assert.equal(rotation(storage)(ids[0]),files[0]);}
const unavailable={getItem(){throw Error('blocked')},setItem(){throw Error('quota')}};assert.equal(rotation(unavailable)(ids[1]),rotation(unavailable)(ids[1]));
console.log('Background rotation: cycle, replay persistence, malformed storage and quota fallback passed');
