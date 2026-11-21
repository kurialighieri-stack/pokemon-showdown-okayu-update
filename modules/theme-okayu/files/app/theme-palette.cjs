// Shared color roles. Pro keeps each original value as its fallback; Okayu
// changes only these variables, so layout and future Pro rules are inherited.
const palette={bg:'#211d2c',panel:'#352c43',raised:'#483953',border:'#725c8c',accent:'#f18abf',text:'#f6e8f1',muted:'#c9b7d1',ink:'#211d2c',shadow:'#130f1c'};
function rgb(hex){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));}
function parse(token){
 if(token[0]==='#'){
  let h=token.slice(1);if(h.length===3||h.length===4)h=[...h].map(c=>c+c).join('');
  if(![6,8].includes(h.length))return null;
  return {c:[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)),a:h.length===8?parseInt(h.slice(6),16)/255:1};
 }
 const values=token.match(/[\d.]+%?/g);if(!values||values.length<3)return null;
 return {c:values.slice(0,3).map(v=>v.endsWith('%')?parseFloat(v)*2.55:+v),a:values[3]?(values[3].endsWith('%')?parseFloat(values[3])/100:+values[3]):1};
}
function recolor(value,property){
 if(property==='--move-accent')return value;
 return value.replace(/url\([^)]*\)|#[\da-f]{3,8}\b|rgba?\([^)]*\)/gi,token=>{
  if(token.startsWith('url'))return token;
  const parsed=parse(token);if(!parsed)return token;
  const {c:[r,g,b],a}=parsed,neutral=Math.max(r,g,b)-Math.min(r,g,b)<25;
  const blue=b>r&&g>=r&&b-r>20;
  if(!neutral&&!blue)return token; // Preserve status, damage, type and warning hues.
  const light=.2126*r+.7152*g+.0722*b;
  let role;
  if(/shadow/.test(property))role=light<90?'shadow':blue?'accent':'text';
  else if(/border|outline|stroke/.test(property))role='border';
  else if(/muted/.test(property))role='muted';
  else if(/accent-ink|enabled-thumb|^--thumb$/.test(property))role='ink';
  else if(/blue|accent/.test(property))role='accent';
  else if(/thumb/.test(property))role='border';
  else if(/raised/.test(property))role='raised';
  else if(/background|surface|button|hover|sidebar|canvas|track|(?:^|-)bg$/.test(property))role=light<34?'bg':light<75?'panel':light<145?'raised':'accent';
  else role=light<65?'ink':light>205?'text':blue&&b-r>45?'accent':'muted';
  return a===1?`var(--pro-color-${role}, ${token})`:`rgba(var(--pro-color-${role}-rgb, ${r}, ${g}, ${b}), ${+a.toFixed(5)})`;
 });
}
function tokenize(css){
 const urls=[];
 css=css.replace(/url\((?:[^()"']|"[^"]*"|'[^']*')*\)/gi,url=>{const index=urls.push(url)-1;return `__PRO_PALETTE_URL_${index}__`;});
 return css.replace(/([^{}]+)\{([^{}]*)\}/g,(block,selector,body)=>{
  // Semantic badges retain their colors, including Water/Ice and HP bars.
  if(/\.type-|\.hp(?:bar)?\b|\.hp-yellow|\.hp-red|\.status\b|\.statbar/.test(selector))return block;
  return selector+'{'+body.replace(/([\w-]+)\s*:\s*([^;{}]+)(;|$)/g,(decl,property,value,end)=>property+':'+recolor(value,property)+end)+'}';
 }).replace(/__PRO_PALETTE_URL_(\d+)__/g,(_,index)=>urls[+index]);
}
const variables=Object.entries(palette).map(([key,value])=>`--pro-color-${key}:${value};--pro-color-${key}-rgb:${rgb(value).join(',')};`).join('\n');
const css=`html.showdown-okayu, :root[data-theme="okayu"] {${variables}}`;
module.exports={palette,recolor,tokenize,css};
