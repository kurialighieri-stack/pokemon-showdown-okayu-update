const fs=require('node:fs'),path=require('node:path');
const {installShowdownLanguages}=require('../app/showdex-language-runtime.cjs');
function transform(source,file){
  const replace=(before,after)=>{if(source.split(before).length!==2)throw new Error('Language patch anchor changed: '+file+': '+before.slice(0,80));source=source.replace(before,after);};
  if(file.endsWith('/utils/app/loadI18nextLocales.ts')){
    source = "import * as ProLanguageAuditCalc from '@smogon/calc';\n" + source;
    const spanish=JSON.parse(fs.readFileSync(path.join(__dirname,'../app/i18n/es.json'),'utf8'));
    replace('i18nRef.value = i18n;',`i18nRef.value = i18n;\n  if ((window as any).__PRO_I18N_AUDIT) (window as any).__showdownProCalcEngineAudit=ProLanguageAuditCalc;\n  await (${installShowdownLanguages.toString()})(i18n,${JSON.stringify(spanish)}).ready;`);
  }else if(file.endsWith('/SettingsPane/GeneralSettingsPane.tsx')){
    replace("const { t } = useTranslation('settings');","const { t, i18n } = useTranslation('settings');");
    const start=source.indexOf("        <Field<ShowdexSettings['locale']>");
    const end=source.indexOf("        <Field<ShowdexSettings['forcedColorScheme']>",start);
    if(start<0||end<0)throw new Error('Language settings field changed');
    source=source.slice(0,start)+`        <div className={styles.field} role="status" aria-label={t('showdex.locale.label')}>
          <span>{t('showdex.locale.label')}</span>{' · '}
          <span>{t('showdex.locale.followShowdown','Same as Showdown')}: {(window as any).Dex?.text?.findLanguage(i18n.language)?.name || i18n.language}</span>
        </div>\n\n`+source.slice(end);
  }else if(file.endsWith('/SettingsPane/SettingsPane.tsx')){
    replace('void i18n.changeLanguage(nextLocale);','void (window as any).__showdownProLanguage?.sync();');
  }else if(file.endsWith('/PokeAbilityOptionTooltip/PokeAbilityOptionTooltip.tsx')||file.endsWith('/PokeItemOptionTooltip/PokeItemOptionTooltip.tsx')){
    replace("import * as React from 'react';","import * as React from 'react';\nimport { useTranslation } from 'react-i18next';");
    replace('  if (!value || hidden) {',"  const { t } = useTranslation('common');\n  if (!value || hidden) {");
    const name=file.includes('Ability')?'Ability':'Item';
    replace(`formatDexDescription(dex${name}?.shortDesc || dex${name}?.desc)`,`formatDexDescription((window as any).__showdownProLanguage?.describe(dex,dex${name}) || dex${name}?.shortDesc || dex${name}?.desc)`);
    replace("{description || 'No description available.'}","{description || t('labels.noDescription','No description available.')}");
  }else if(file.endsWith('/PokeMoveOptionTooltip/PokeMoveOptionTooltip.tsx')){
    replace('    dexUltMove?.shortDesc\n',"    (window as any).__showdownProLanguage?.describe(dex,dexUltMove,dexMove)\n      || dexUltMove?.shortDesc\n");
  }else if(file.endsWith('/pages/Bootdex/BootdexAdapter.ts')){
    // A read-only view of the actual calculation state is available only to
    // isolated audits; nothing is added to normal user sessions.
    replace('    this.__initialized = true;',`    if ((window as any).__PRO_I18N_AUDIT) (window as any).__showdownProCalcAudit={getState:()=>this.rootState};\n    this.__initialized = true;`);
  }
  return source;
}
module.exports={transform};
