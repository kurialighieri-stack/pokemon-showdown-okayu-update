const fs=require('node:fs'),path=require('node:path');
let cached;
module.exports=()=>{
 if(cached!==undefined)return cached;
 const paletteFile=path.join(__dirname,'theme-palette.cjs'),palette=fs.existsSync(paletteFile)?require(paletteFile):null;
 const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
 const extra=['theater-mode.css','client-replays.css'].map(name=>{const css=read(name);return palette?palette.tokenize(css):css;});
 return cached=[require('./client-theme-css.cjs'),...extra,read('okayu-update.css')].join('\n');
};
