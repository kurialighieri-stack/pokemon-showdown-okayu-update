/* Labels consume the original tooltip effectiveness calculation, never a second chart. */
(()=>{
 function label(value){if(value===null)return '';if(value===0)return TL`No effect`;if(value<.5)return TL`Mostly ineffective`;if(value<1)return TL`Not very effective`;if(value>2)return TL`Extremely effective`;if(value>1)return TL`Super effective`;return TL`Effective`;}
 function install(){const proto=window.BattlePanel?.prototype;if(!proto||proto.__okayuEffectiveness)return;proto.__okayuEffectiveness=true;const render=proto.renderMoveButton;
  proto.renderMoveButton=function(props){const node=render.apply(this,arguments),room=this.props.room;if(!props||!room.side||!room.request||!node?.props)return node;
   try{
    const battle=room.battle,tooltips=battle.scene.tooltips,parts=props.tooltip.split('|'),sourceIndex=Number(parts[2])||0,source=battle.nearSide.active[sourceIndex];if(!source)return node;
    let move=battle.dex.moves.get(parts[1]);if(parts[0]==='maxmove')move=move.category==='Status'?battle.dex.moves.get('Max Guard'):tooltips.getMaxMoveFromType(props.type,parts[3]||undefined);
    if(parts[0]==='zmove'){const i=Number(props.cmd.match(/^\/move (\d+)/)?.[1])-1,data=room.request.active?.[sourceIndex]?.zMoves?.[i];if(data?.name)move=battle.dex.moves.get(data.name);}
    if(!move.exists||move.category==='Status')return node;
    const values=battle.farSide.active.filter(p=>p&&!p.fainted).map(p=>({name:tooltips.getNickname(p),value:tooltips.getMoveEffectiveness(source,move,props.type,move.category,p)}));if(!values.length)return node;
    const same=values.every(p=>p.value===values[0].value),text=same?label(values[0].value):values.map(p=>p.name.slice(0,12)+': '+(p.value===null?'?':p.value+'×')).join(' · ');if(!text)return node;
    const description=values.map(p=>p.name+': '+(label(p.value)||'?')).join(' · '),children=Array.isArray(node.props.children)?node.props.children:[node.props.children];node.props.children=[...children,preact.h('small',{class:'okayu-move-effect','data-effectiveness':values.map(p=>p.value===null?'?':p.value).join(','),'aria-label':description,title:description},text)];
   }catch(error){console.warn('[okayu-move-effect]',error);}return node;
  };
 }
 window.okayuMoveEffectiveness={install};install();
})();
