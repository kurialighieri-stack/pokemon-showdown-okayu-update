(async()=>{
 const wait=ms=>new Promise(r=>setTimeout(r,ms)),id='battle-gen9customgame-999992';
 if(Object.values(PS.rooms).some(r=>r.id!==id&&r.side&&r.battle&&!r.battle.ended))throw Error('Live battle active; test aborted');
 PS.connection.send=()=>{};
 PS.receive('>'+id+'\n'+['|init|battle','|title|Android Layout Test','|gametype|doubles','|player|p1|Test|1','|player|p2|Other|2','|teamsize|p1|6','|teamsize|p2|6','|gen|9','|tier|[Gen 9] Custom Game','|start','|switch|p1a: Milotic|Milotic, L50|100/100','|switch|p1b: Mimikyu|Mimikyu, L50|100/100','|switch|p2a: Pikachu|Pikachu, L50|100/100','|switch|p2b: Stantler|Stantler, L50|100/100','|turn|1'].join('\n'));
 PS.focusRoom(id);for(let i=0;i<50&&!PS.rooms[id]?.battle;i++)await wait(100);PS.rooms[id].battle.seekTurn(Infinity);await wait(1200);
 const root=document.getElementById('room-'+id),battle=root.querySelector('.battle'),controls=root.querySelector('.battle-controls'),r=battle.getBoundingClientRect(),c=controls.getBoundingClientRect(),reference=PS.rooms[id].battle;
 const enemy=root.querySelector('.phd-row.enemy')?.getBoundingClientRect(),toolbar=document.getElementById('okayu-toolbar').getBoundingClientRect();if(enemy&&enemy.top<toolbar.bottom-1)throw Error('Enemy banner intersects toolbar');if(Math.abs(r.width/r.height-16/9)>0.001)throw Error('Battle aspect ratio changed');const results={enemy:enemy?.toJSON(),toolbar:toolbar.toJSON(),viewport:[innerWidth,innerHeight],battle:r.toJSON(),controls:c.toJSON(),showdex:!!window.__SHOWDEX_INIT};
 okayuAndroid.open('log');await wait(50);results.log=getComputedStyle(root.querySelector('.battle-log')).display!=='none';okayuAndroid.back();results.closed=!document.documentElement.dataset.okayuPanel;
 okayuAndroid.open('rooms');await wait(50);results.rooms=!!document.querySelector('#okayu-panel');okayuAndroid.back();results.sameBattle=reference===PS.rooms[id].battle;
 results.preferences=await okayuBridge.request('preferences.get');
 try{await okayuBridge.request('unsupported');results.rejectsUnsupported=false;}catch{results.rejectsUnsupported=true;}
 return results;
})()
