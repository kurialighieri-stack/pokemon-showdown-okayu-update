import hashlib,json,os,tempfile,unittest,zipfile
from pathlib import Path
from unittest.mock import patch
from okayu_update.xpi import ADDON_ID,REQUIRED,discover_xpis,firefox_roots,validate_xpi,local_xpi_path
from okayu_update.manager import ModError

class FirefoxXpi(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.home=Path(self.tmp.name).resolve()
  self.spec={'acceptedPackages':[]}
 def package(self,path,origin='mozilla',version='1.4',identity=ADDON_ID,missing=None):
  path.parent.mkdir(parents=True,exist_ok=True)
  with zipfile.ZipFile(path,'w') as z:
   for name in REQUIRED:
    if name==missing:continue
    z.writestr(name,json.dumps({'version':version,'manifest_version':2,'browser_specific_settings':{'gecko':{'id':identity}}}) if name=='manifest.json' else '// '+origin)
  self.spec['acceptedPackages'].append({'origin':origin,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()});return path
 def profile(self,sub,origin='mozilla'):
  profile=self.home/sub/'abc.default-release'
  return self.package(profile/'extensions'/(ADDON_ID+'.xpi'),origin)
 def find(self):
  with patch.dict(os.environ,{'XDG_CONFIG_HOME':str(self.home/'.config')}):return discover_xpis(self.spec,home=self.home)
 def test_native_flatpak_snap_and_both_official_origins(self):
  paths=[self.profile(p,'github' if i%2 else 'mozilla') for i,p in enumerate([
   '.mozilla/firefox','.config/mozilla/firefox','.var/app/org.mozilla.firefox/.mozilla/firefox',
   '.var/app/org.mozilla.firefox/config/mozilla/firefox','snap/firefox/common/.mozilla/firefox','snap/firefox/current/.config/mozilla/firefox'])]
  originals={p:p.read_bytes() for p in paths};found=self.find()
  self.assertEqual({x.path for x in found},set(paths));self.assertEqual({x.origin for x in found},{'mozilla','github'})
  self.assertEqual({p:p.read_bytes() for p in paths},originals)
 def test_custom_absolute_profile_and_registry_jar_uri(self):
  root=self.home/'.mozilla/firefox';root.mkdir(parents=True);profile=self.home/'custom profile';profile.mkdir()
  (root/'profiles.ini').write_text('[Profile0]\nIsRelative=0\nPath='+str(profile)+'\n')
  xpi=self.package(self.home/'external file.xpi','github')
  (profile/'extensions.json').write_text(json.dumps({'addons':[{'id':ADDON_ID,'active':False,'rootURI':'jar:'+xpi.as_uri()+'!/'}]}))
  found=self.find();self.assertEqual([x.path for x in found],[xpi]);self.assertEqual(found[0].origin,'github')
 @unittest.skipIf(os.name=='nt','Windows symlinks require extra privileges')
 def test_relative_installs_registry_and_symlink_deduplication(self):
  xpi=self.profile('.mozilla/firefox');root=xpi.parents[2];(root/'installs.ini').write_text('[HASH]\nDefault=abc.default-release\n')
  alias=self.home/'.config/mozilla/firefox';alias.parent.mkdir(parents=True);alias.symlink_to(root,target_is_directory=True)
  (xpi.parents[1]/'extensions.json').write_text(json.dumps({'addons':[{'id':ADDON_ID,'path':str(xpi)}]}))
  self.assertEqual(len(self.find()),1)
 def test_xdg_config_root(self):
  config=self.home/'xdg';xpi=self.profile('xdg/mozilla/firefox')
  with patch.dict(os.environ,{'XDG_CONFIG_HOME':str(config)}):self.assertEqual(discover_xpis(self.spec,home=self.home)[0].path,xpi)
 def test_invalid_hash_skipped_and_manual_refused(self):
  xpi=self.profile('.mozilla/firefox');xpi.write_bytes(xpi.read_bytes()+b'changed')
  self.assertEqual(self.find(),[])
  with self.assertRaisesRegex(ModError,'SHA-256'):validate_xpi(xpi,self.spec)
 def test_known_hash_does_not_replace_compatibility_validation(self):
  for name,kwargs in [('version',{'version':'1.5'}),('id',{'identity':'other'}),('files',{'missing':'patch.js'})]:
   xpi=self.package(self.home/(name+'.xpi'),**kwargs)
   with self.assertRaises(ModError):validate_xpi(xpi,self.spec)
 def test_corrupt_metadata_does_not_prevent_direct_detection(self):
  xpi=self.profile('.mozilla/firefox');root=xpi.parents[2]
  (root/'profiles.ini').write_text('broken');(xpi.parents[1]/'extensions.json').write_text('{broken')
  self.assertEqual(self.find()[0].path,xpi)
 def test_remote_registry_urls_are_ignored(self):
  self.assertIsNone(local_xpi_path('https://example.test/file.xpi',self.home))
  self.assertIsNone(local_xpi_path('file://remote/file.xpi',self.home))
 def test_gui_detect_manual_and_download_routes(self):
  from okayu_update import __main__ as ui
  xpi=self.profile('.mozilla/firefox');found=self.find()
  for answers in [['found:0'],['manual',str(xpi)],['github','',str(xpi)],['mozilla','',str(xpi)]]:
   with patch('okayu_update.xpi.discover_xpis',return_value=found),patch.object(ui,'progress',side_effect=lambda _,fn:fn()),patch.object(ui,'dialog',side_effect=answers),patch.object(ui.webbrowser,'open') as browser:
    self.assertEqual(ui.choose_showdown_xpi(self.spec),str(xpi));self.assertEqual(browser.call_count,1 if answers[0] in ('github','mozilla') else 0)

class XpiImport(unittest.TestCase):
 def setUp(self):
  from test_manager import Transactions
  Transactions.setUp(self)
  self.xpi=self.root/'github.xpi'
  manifest={'version':'1.4','manifest_version':2,'browser_specific_settings':{'gecko':{'id':ADDON_ID}}}
  with zipfile.ZipFile(self.xpi,'w') as z:
   for name in REQUIRED:z.writestr(name,json.dumps(manifest) if name=='manifest.json' else '// source')
  p=self.repo/'modules/sample/addon.json';data=json.loads(p.read_text());data['import']={'destination':'addons/showdown-plus','acceptedPackages':[{'origin':'github','sha256':hashlib.sha256(self.xpi.read_bytes()).hexdigest()}]};p.write_text(json.dumps(data))
 def tree(self):return {p.relative_to(self.app).as_posix():p.read_bytes() for p in self.app.rglob('*') if p.is_file()}
 def test_manual_snapshot_is_verified_and_original_unchanged(self):
  before=self.xpi.read_bytes();self.m.apply(['sample'],xpi=self.xpi)
  installed=json.loads((self.app/'app/okayu-update-installed.json').read_text())
  self.assertEqual(installed['imports']['sample']['origin'],'github');self.assertNotIn(str(self.xpi),json.dumps(installed));self.assertEqual(self.xpi.read_bytes(),before)
  self.m.revert();self.assertEqual(self.tree(),self.original)
 def test_auto_selection_reuses_discovered_xpi(self):
  from okayu_update.xpi import Xpi
  with patch('okayu_update.xpi.discover_xpis',return_value=[Xpi(self.xpi,'','github')]):self.m.apply(['sample'])
  self.assertTrue((self.app/'addons/showdown-plus/patch.js').is_file())
 def test_snapshot_changed_while_copying_fails_without_modifying_app(self):
  import okayu_update.manager as manager
  copy=manager.shutil.copyfile
  def changed(source,target):
   result=copy(source,target);Path(target).write_bytes(b'changed during copy');return result
  with patch.object(manager.shutil,'copyfile',side_effect=changed),self.assertRaises(ModError):self.m.apply(['sample'],xpi=self.xpi)
  self.assertEqual(self.tree(),self.original)
 def test_auto_no_match_has_actionable_error(self):
  with patch('okayu_update.xpi.discover_xpis',return_value=[]),self.assertRaisesRegex(ModError,'GitHub'):self.m.prepare(['sample'])
