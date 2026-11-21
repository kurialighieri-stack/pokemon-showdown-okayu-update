"""Read-only Firefox XPI discovery and validation for the pinned Showdown+ adapter."""
from __future__ import annotations
import configparser,hashlib,json,os,zipfile,itertools
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlsplit,unquote
from .manager import ModError

ADDON_ID='PokemonShowdownHD@NathanMichael'
RELEASE_URL='https://github.com/JxstMichie/PokemonShowdownPlus/releases/tag/v1.4'
MOZILLA_URL='https://addons.mozilla.org/firefox/addon/pokemon-showdown-plus/'
REQUIRED=('manifest.json','config.js','patch.js','loader.js','sprites.txt','ui/settings.html','ui/settings.js')

@dataclass(frozen=True)
class Xpi:
    path: Path
    sha256: str
    origin: str
    browser: str=''
    profile: str=''
    version: str='1.4'

def sha256_file(path):
    h=hashlib.sha256()
    with Path(path).open('rb') as f:
        for block in iter(lambda:f.read(1024*1024),b''):h.update(block)
    return h.hexdigest()

def validate_xpi(path,spec):
    path=Path(path).expanduser().resolve()
    if not path.is_file():raise ModError('No se encontró el XPI seleccionado.')
    expected={p['sha256']:p for p in spec.get('acceptedPackages',[])}
    if not expected and spec.get('sha256'):expected[spec['sha256']]={'origin':'mozilla'}
    actual=sha256_file(path)
    if actual not in expected:raise ModError('El SHA-256 del XPI no coincide con los paquetes oficiales compatibles de Showdown+ 1.4. Descárgalo desde los enlaces oficiales o elige otro archivo.')
    try:
        with zipfile.ZipFile(path) as z:
            if not set(REQUIRED).issubset(z.namelist()):raise ModError('El XPI no contiene los archivos requeridos por la adaptación.')
            if z.getinfo('manifest.json').file_size>1024*1024:raise ModError('Manifiesto de XPI demasiado grande.')
            manifest=json.loads(z.read('manifest.json'))
            identity=(manifest.get('browser_specific_settings') or manifest.get('applications') or {}).get('gecko',{}).get('id')
            if identity!=ADDON_ID or manifest.get('version')!='1.4' or manifest.get('manifest_version')!=2:raise ModError('El XPI no corresponde a la versión y la identidad de Showdown+ compatibles con este adaptador.')
    except (zipfile.BadZipFile,KeyError,ValueError,TypeError,AttributeError) as error:raise ModError('No se pudo verificar la compatibilidad del XPI.') from error
    return Xpi(path,actual,expected[actual].get('origin','official'))

def firefox_roots(home=None):
    home=Path(home or Path.home());config=Path(os.environ.get('XDG_CONFIG_HOME',home/'.config'))
    roots=[(home/'.mozilla/firefox','Firefox Linux'),(home/'.config/mozilla/firefox','Firefox Linux'),(config/'mozilla/firefox','Firefox Linux'),
      (home/'.var/app/org.mozilla.firefox/.mozilla/firefox','Firefox Flatpak'),
      (home/'.var/app/org.mozilla.firefox/config/mozilla/firefox','Firefox Flatpak'),
      (home/'.var/app/org.mozilla.firefox/.config/mozilla/firefox','Firefox Flatpak')]
    for revision in ('common','current'):
        for sub in ('.mozilla/firefox','.config/mozilla/firefox'):roots.append((home/'snap/firefox'/revision/sub,'Firefox Snap'))
    seen=set()
    for root,browser in roots:
        resolved=root.expanduser().resolve()
        if resolved not in seen:seen.add(resolved);yield resolved,browser

def children(path,limit=300):
    try:return list(itertools.islice(Path(path).iterdir(),limit))
    except OSError:return []

def profiles(root):
    seen=set()
    for filename in ('profiles.ini','installs.ini'):
        p=root/filename
        try:
            if p.stat().st_size>2*1024*1024:continue
            config=configparser.ConfigParser(interpolation=None,strict=False);config.read_string(p.read_text())
            for section in config.sections():
                values=config[section];name=values.get('Path') if section.lower().startswith('profile') else values.get('Default')
                if not name:continue
                path=Path(name).expanduser()
                if not path.is_absolute():path=root/path
                path=path.resolve()
                if path.is_dir() and path not in seen:seen.add(path);yield path
        except (OSError,ValueError,configparser.Error):continue
    # Also include profiles not selected by the active installation's registry.
    for p in children(root):
        if p.is_dir() and ((p/'extensions.json').is_file() or (p/'extensions').is_dir()):
            p=p.resolve()
            if p not in seen:seen.add(p);yield p

def local_xpi_path(value,profile):
    if not isinstance(value,str) or not value:return None
    if value.startswith('jar:'):value=value[4:].split('!/',1)[0]
    if value.startswith('file:'):
        parsed=urlsplit(value)
        if parsed.netloc not in ('','localhost'):return None
        value=unquote(parsed.path)
    elif '://' in value:return None
    p=Path(value).expanduser()
    if not p.is_absolute():p=profile/p
    return p.resolve() if p.suffix.lower()=='.xpi' else None

def discover_xpis(spec,home=None,roots=None):
    results=[];seen_profiles=set();seen_files=set()
    for root,browser in roots if roots is not None else firefox_roots(home):
        root=Path(root)
        for profile in profiles(root):
            if profile in seen_profiles:continue
            seen_profiles.add(profile)
            candidates=[profile/'extensions'/(ADDON_ID+'.xpi')]
            registry=profile/'extensions.json'
            try:
                if registry.stat().st_size<8*1024*1024:
                    for addon in json.loads(registry.read_text()).get('addons',[]):
                        if addon.get('id')==ADDON_ID:
                            for key in ('path','rootURI'):
                                path=local_xpi_path(addon.get(key),profile)
                                if path:candidates.append(path)
            except (OSError,ValueError,AttributeError,TypeError):pass
            for candidate in candidates:
                path=candidate.resolve()
                if path in seen_files:continue
                seen_files.add(path)
                try:item=validate_xpi(path,spec)
                except (ModError,OSError):continue
                results.append(Xpi(item.path,item.sha256,item.origin,browser,profile.name,item.version))
    return results
