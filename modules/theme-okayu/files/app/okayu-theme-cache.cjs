const fs=require('node:fs'),path=require('node:path');
const valid=value=>['light','dark','pro','okayu'].includes(value);
let cached;
function filename(){return path.join(require('electron').app.getPath('userData'),'okayu-theme.json');}
function read(){if(cached)return cached;try{const value=JSON.parse(fs.readFileSync(filename(),'utf8'));if(valid(value))cached=value;}catch{}return cached||'okayu';}
function remember(value){if(!valid(value)||cached===value)return;const file=filename();fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',JSON.stringify(value)+'\n',{mode:0o600});fs.renameSync(file+'.tmp',file);cached=value;}
module.exports={read,remember};
