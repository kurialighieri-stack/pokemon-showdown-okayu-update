import json,os,subprocess,sys,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
from okayu_update.manager import Manager,ModError,safe
from okayu_update.platforms import WINDOWS,file_lock,long_path,windows_processes

@unittest.skipUnless(WINDOWS,'Windows integration')
class WindowsIntegration(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name).resolve()
 def install(self):
  target=self.root/'Showdown con espacios';app=target/'resources/app';(app/'app').mkdir(parents=True)
  (app/'package.json').write_text('{"name":"pokemon-showdown-pro","version":"1.2.0"}')
  (app/'app/main.cjs').write_text('original')
  (target/'Pokemon Showdown Pro.exe').write_bytes(b'fixture')
  return target
 def test_windows_exe_discovery_and_module_catalog(self):
  from okayu_update.discovery import inspect
  target=self.install();self.assertEqual(inspect(target/'Pokemon Showdown Pro.exe').path,target)
  self.assertNotIn('glass',[m['id'] for m in Manager(target,state=self.root/'state').catalog()])
  with self.assertRaises(ModError):Manager(target,state=self.root/'state').prepare(['glass'],build=False)
 def test_windows_specific_compatibility(self):
  m=Manager(self.install(),state=self.root/'state')
  self.assertEqual(m.compatibility()['platform'],'windows')
  self.assertIn('-windows',m.compatibility_path().name)
 def test_lock_is_refused_by_a_second_process(self):
  lock=self.root/'lock'
  code="from okayu_update.platforms import file_lock; import sys;\nwith file_lock(sys.argv[1]): pass"
  with file_lock(lock):
   p=subprocess.run([sys.executable,'-X','utf8','-c',code,str(lock)],capture_output=True)
   self.assertNotEqual(p.returncode,0);self.assertIn(b'BlockingIOError',p.stderr)
  with file_lock(lock):pass
 def test_process_inspection_sees_a_live_child(self):
  child=subprocess.Popen([sys.executable,'-c','import time;time.sleep(30)'])
  try:self.assertIn(Path(sys.executable).resolve(),list(windows_processes()))
  finally:child.terminate();child.wait()
 def test_running_installation_is_refused(self):
  from okayu_update.manager import require_closed
  target=self.install();m=Manager(target,state=self.root/'state')
  with patch('okayu_update.manager.windows_processes',return_value=iter([target/'Pokemon Showdown Pro.exe'])):
   with self.assertRaises(ModError):require_closed(m.root)
 def test_firefox_windows_registry_and_file_uri(self):
  from okayu_update.xpi import firefox_roots,local_xpi_path
  with patch.dict(os.environ,{'APPDATA':str(self.root)}):self.assertIn((self.root/'Mozilla/Firefox','Firefox Windows'),list(firefox_roots()))
  xpi=self.root/'archivo con espacios.xpi';self.assertEqual(local_xpi_path('jar:'+xpi.as_uri()+'!/',self.root),xpi)
 def test_shortcut_is_owned_and_target_specific(self):
  from okayu_update.windows import create_shortcut,remove_shortcut,shortcut_info
  target=self.install();folder=self.root/'Start menu';shortcut=create_shortcut(target,folder)
  self.assertEqual(Path(json.loads(shortcut_info(shortcut))['target']),target/'Pokemon Showdown Pro.exe')
  other=self.root/'other';other.mkdir();(other/'Pokemon Showdown Pro.exe').write_bytes(b'fixture')
  remove_shortcut(other,folder);self.assertTrue(shortcut.exists())
  remove_shortcut(target,folder);self.assertFalse(shortcut.exists())
 def test_zip_with_unknown_hash_is_refused(self):
  from okayu_update.windows import prepare_zip
  archive=self.root/'other.zip';archive.write_bytes(b'unknown')
  with self.assertRaisesRegex(ModError,'ZIP'):prepare_zip(archive,self.root/'data')
 def test_windows_drive_and_stream_paths_are_refused(self):
  for name in ['C:/outside','app/file:stream','../outside','/absolute','app\\file','app/NUL.txt','app/.. /file','app/name.']:
   with self.subTest(name=name),self.assertRaises(ModError):safe(self.root,name)
 def test_dialog_request_parses_unicode_and_rows(self):
  request=self.root/'request.json';request.write_text(json.dumps(['--list','--checklist','--title=Módulos','TRUE','performance','Optimización','FALSE','showdown-plus','Showdown+']),encoding='utf-8')
  script=Path(__file__).resolve().parents[1]/'okayu_update/windows-dialog.ps1'
  result=subprocess.run(['powershell.exe','-NoProfile','-ExecutionPolicy','Bypass','-File',str(script),str(request),'-ValidateOnly'],text=True,encoding='utf-8',capture_output=True,check=True)
  parsed=json.loads(result.stdout);self.assertEqual(parsed['title'],'Módulos');self.assertEqual(len(parsed['rows']),6);self.assertTrue(parsed['options']['checklist'])
