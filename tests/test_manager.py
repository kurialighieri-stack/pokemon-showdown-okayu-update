import json,tempfile,unittest,hashlib,zipfile,os
from pathlib import Path
from okayu_update.manager import Manager,ModError,digest,unpack

class Transactions(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name)
  self.app=self.root/'install/resources/app';self.app.mkdir(parents=True)
  (self.app/'app').mkdir();(self.app/'package.json').write_text('{"version":"1.2.0"}');(self.app/'app/main.cjs').write_text('const original = true;\n')
  (self.app/'app/client-startup.cjs').write_text('original startup')
  self.repo=self.root/'repo';(self.repo/'modules').mkdir(parents=True);(self.repo/'compatibility').mkdir()
  (self.repo/'modules/index.json').write_text('["core","sample"]')
  for key,files,edits in [('core',{},[]),('sample',{'app/new.js':'hello'},[{'path':'app/main.cjs','find':'original = true','replace':'original = false'}])]:
   p=self.repo/'modules'/key;(p/'files').mkdir(parents=True)
   hashes={}
   for name,text in files.items():
    f=p/'files'/name;f.parent.mkdir(parents=True,exist_ok=True);f.write_text(text);hashes[name]=digest(f.read_bytes())
   (p/'addon.json').write_text(json.dumps({'id':key,'name':key,'order':0 if key=='core' else 1,'files':hashes,'edits':edits,'appVersions':['1.2.0']}))
  (self.repo/'compatibility/1.2.0.json').write_text(json.dumps({'appVersion':'1.2.0','files':{'app/main.cjs':digest((self.app/'app/main.cjs').read_bytes())}}))
  self.m=Manager(self.app,self.root/'state',self.repo);self.original=self.tree()
 def tree(self):return {p.relative_to(self.app).as_posix():p.read_bytes() for p in self.app.rglob('*') if p.is_file()}
 def test_apply_reapply_restore_exact_bytes(self):
  self.m.apply(['sample']);first=self.tree();self.assertEqual(self.m.status()['state'],'installed')
  self.m.apply(['sample']);self.assertEqual(first,self.tree())
  self.m.revert();self.assertEqual(self.tree(),self.original)
 def test_change_selected_modules_removes_old_changes(self):
  self.m.apply(['sample']);self.m.apply([]);self.assertEqual((self.app/'app/main.cjs').read_bytes(),self.original['app/main.cjs']);self.assertFalse((self.app/'app/new.js').exists());self.m.revert();self.assertEqual(self.tree(),self.original)
 def test_write_failure_rolls_back(self):
  with self.assertRaises(ModError):self.m.apply(['sample'],fail_after=0)
  self.assertEqual(self.tree(),self.original);self.assertFalse(self.m.receipt.exists());self.assertFalse(self.m.journal.exists())
 def test_tampering_prevents_restore(self):
  self.m.apply(['sample']);(self.app/'app/main.cjs').write_text('external edit');before=self.tree()
  with self.assertRaises(ModError):self.m.revert()
  self.assertEqual(self.tree(),before)
 def test_update_is_never_downgraded(self):
  self.m.apply(['sample']);(self.app/'package.json').write_text('{"version":"2.0.0"}');(self.app/'app/main.cjs').write_text('new version');before=self.tree();m=Manager(self.app,self.root/'state',self.repo)
  with self.assertRaises(ModError):m.revert()
  with self.assertRaises(ModError):m.apply(['sample'])
  self.assertEqual(self.tree(),before)
 def test_known_clean_reinstall_can_be_modified_again(self):
  self.m.apply(['sample']);(self.app/'app/main.cjs').write_bytes(self.original['app/main.cjs']);self.m.apply(['sample']);self.m.revert();self.assertEqual(self.tree(),self.original)
 def test_unknown_file_content_refused(self):
  (self.app/'app/main.cjs').write_text('unexpected');before=self.tree()
  with self.assertRaises(ModError):self.m.apply(['sample'])
  self.assertEqual(before,self.tree())
 def test_unmanaged_file_not_overwritten(self):
  (self.app/'app/new.js').write_text('mine');before=self.tree()
  with self.assertRaises(ModError):self.m.apply(['sample'])
  self.assertEqual(before,self.tree())
 def test_plan_does_not_modify_installation(self):
  self.m.prepare(['sample'],build=False);self.assertEqual(self.tree(),self.original)
 def test_symlink_target_refused(self):
  external=self.root/'external';external.write_text('mine');(self.app/'app/new.js').symlink_to(external)
  with self.assertRaises(ModError):self.m.apply(['sample'])
  self.assertEqual(external.read_text(),'mine')
 def test_archive_traversal_refused(self):
  z=self.root/'evil.zip'
  with zipfile.ZipFile(z,'w') as f:f.writestr('../outside','bad')
  with self.assertRaises(ModError):unpack(z,self.root/'extracted')
 def test_recovery_after_process_termination(self):
  pid=os.fork()
  if pid==0:
   import okayu_update.manager as implementation
   original=implementation.atomic
   def interrupt(path,data):
    original(path,data)
    if path.is_relative_to(self.app):os._exit(7)
   implementation.atomic=interrupt
   self.m.apply(['sample']);os._exit(1)
  _,status=os.waitpid(pid,0);self.assertEqual(os.waitstatus_to_exitcode(status),7)
  self.assertTrue(self.m.journal.exists());self.m.recover();self.assertEqual(self.tree(),self.original)
 def test_corrupt_backup_is_not_restored(self):
  self.m.apply(['sample']);receipt=json.loads(self.m.receipt.read_text())
  backup=self.m.directory/'transactions'/receipt['id']/'backup/app/main.cjs';backup.write_text('corrupt')
  before=self.tree()
  with self.assertRaises(ModError):self.m.revert()
  self.assertEqual(self.tree(),before)
 def test_concurrent_operation_refused(self):
  import fcntl
  self.m.directory.mkdir(parents=True)
  with (self.m.directory/'.lock').open('a') as lock:
   fcntl.flock(lock,fcntl.LOCK_EX)
   with self.assertRaises(ModError):self.m.apply(['sample'])
  self.assertEqual(self.tree(),self.original)
 def test_binary_icon_is_restored_when_module_is_removed(self):
  icon='app/assets/icons/icon.png';p=self.app/icon;p.parent.mkdir(parents=True);original=b'\x89PNG\r\noriginal';p.write_bytes(original)
  compat=self.repo/'compatibility/1.2.0.json';data=json.loads(compat.read_text());data['files'][icon]=digest(original);compat.write_text(json.dumps(data))
  payload=self.repo/'modules/sample/files'/icon;payload.parent.mkdir(parents=True);payload.write_bytes(b'\x89PNG\r\nokayulogo')
  manifest=self.repo/'modules/sample/addon.json';data=json.loads(manifest.read_text());data['files'][icon]=digest(payload.read_bytes());manifest.write_text(json.dumps(data))
  self.m.apply(['sample']);self.assertEqual(p.read_bytes(),payload.read_bytes())
  self.m.apply([]);self.assertEqual(p.read_bytes(),original);self.m.revert();self.assertEqual(p.read_bytes(),original)
 def test_diagnostics_exclude_path_and_profile(self):
  report=json.dumps(self.m.diagnostic());self.assertNotIn(str(self.root),report);self.assertNotIn('cookies',report)

if __name__=='__main__':unittest.main()
