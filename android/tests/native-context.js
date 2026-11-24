(async()=>{
 const wait=ms=>new Promise(r=>setTimeout(r,ms)),id='battle-gen9customgame-999992',room=PS.rooms[id],root=document.getElementById('room-'+id),sent=[];
 const assert=(v,m)=>{if(!v)throw Error(m);};PS.connection.send=(...args)=>sent.push(args);
 const buttons=()=>[...document.querySelectorAll('#okayu-combat-menu button')],phase=()=>document.documentElement.dataset.okayuMenu;
 while(window.BattleTooltips?.elem)BattleTooltips.hideTooltip();okayuAndroid.back();await wait(80);
 assert(phase()==='main','Expected main menu');assert(buttons().map(b=>b.textContent).join('|')==='Luchar|Pokémon|Calcdex|Chat|Huir','Five actions and order');
 const original=JSON.stringify(room.choices.choices);
 buttons()[0].click();await wait(80);assert(phase()==='moves','Moves submenu');assert(JSON.stringify(room.choices.choices)===original,'Opening moves changed choice');
 document.querySelector('#okayu-context-back').click();await wait(80);buttons()[1].click();await wait(80);
 assert(phase()==='pokemon','Team submenu');const panel=root.querySelector('.battle-controls'),cards=[...root.querySelectorAll('.switchmenu button')];assert(cards.length===6,'Six native team cards');assert(panel.scrollHeight<=panel.clientHeight+2,'Team chooser requires scrolling');assert(cards.slice(0,2).every(b=>b.getAttribute('aria-disabled')==='true'),'Active Pokemon remain disabled');
 const teamBox=panel.getBoundingClientRect();document.querySelector('#okayu-team-back').click();await wait(80);
 buttons()[0].click();await wait(80);root.querySelectorAll('.movemenu button')[1].click();await wait(150);assert(phase()==='target','Doubles target phase');assert(room.choices.current.move,'Native target choice missing');
 if(BattleTooltips.elem)BattleTooltips.hideTooltip();okayuAndroid.back();await wait(150);assert(!room.choices.current.move,'Back did not clear native pending target');
 if(phase()!=='main'){okayuAndroid.back();await wait(100);}
 buttons()[4].click();await wait(100);assert(PS.popups.some(p=>p.includes('forfeit')),'Native forfeit confirmation not opened');PS.closePopup();await wait(60);
 assert(!sent.some(a=>/\/(?:choose|forfeit)\b/.test(a.join(' '))),'Opening menus sent a decision');
 const originalRequest=JSON.parse(JSON.stringify(room.request));const forced={side:originalRequest.side,forceSwitch:[true,false],rqid:200};PS.receive('>'+id+'\n|request|'+JSON.stringify(forced).replace(/\|/g,'\\u007c'));await wait(100);assert(phase()==='forced','Forced switch did not open directly');okayuAndroid.back();await wait(60);assert(phase()==='forced','Back escaped a forced switch');
 PS.receive('>'+id+'\n|request|'+JSON.stringify({...originalRequest,rqid:201}).replace(/\|/g,'\\u007c'));await wait(100);
 return {fiveActions:true,nativeMoves:true,teamCards:cards.length,teamScroll:false,teamBox:teamBox.toJSON(),nativeTargetAndBack:true,nativeForfeitConfirmation:true,noDecisionsOnMenuOpen:true,forcedSwitch:true};
})()
