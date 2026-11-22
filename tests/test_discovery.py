import json,os,stat,subprocess,tempfile,unittest
from pathlib import Path
from unittest.mock import patch,Mock
from okayu_update.discovery import discover,inspect,desktop_targets,prepare_image,file_hash,create_shortcut,remove_shortcut,process_targets,remember,Installation
from okayu_update.manager import ModError,app_root

@unittest.skipIf(os.name=='nt','Linux AppImage, desktop entry and /proc integration')
class Discovery(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name)
  self.home=self.root/'home';self.home.mkdir();self.data=self.root/'data';self.apps=self.root/'applications';self.apps.mkdir();self.proc=self.root/'proc';self.proc.mkdir()
 def install(self,name='Showdown Pro'):
  d=self.home/name;app=d/'resources/app/app';app.mkdir(parents=True)
  (app/'main.cjs').write_text('original')
  (d/'resources/app/package.json').write_text(json.dumps({'name':'pokemon-showdown-pro','version':'1.2.0'}))
  (d/'AppRun').write_text('#!/bin/sh\n');return d
 def image(self,name='PokemonShowdownPro-1.2.0.AppImage'):
  p=self.home/name;p.write_bytes(b'\x7fELF\x02\x01\x01\x00AI\x02\x00'+b'fixture');p.chmod(0o644);return p
 def find(self,roots=None):return discover(home=self.home,data=self.data,application_dirs=[self.apps],search_dirs=roots or [],proc=self.proc)
 def test_finds_image_from_quoted_desktop_exec(self):
  image=self.image('Pokemon Showdown Pro 1.2.0.AppImage')
  (self.apps/'pokemon-showdown-pro.desktop').write_text('[Desktop Entry]\nType=Application\nExec="'+str(image)+'" --no-sandbox %U\n')
  found=self.find();self.assertEqual(len(found),1);self.assertEqual(found[0].path,image);self.assertEqual(found[0].kind,'appimage')
 def test_does_not_execute_desktop_commands(self):
  file=self.apps/'showdown.desktop';file.write_text('[Desktop Entry]\nType=Application\nExec=sh -c "touch /tmp/should-not-run"\n')
  self.assertEqual(desktop_targets(file),[])
 def test_ignores_experimental_and_temporary_mounts(self):
  install=self.install();(install/'resources/app/package.json').write_text('{"name":"pokemon-showdown-pro-plus","version":"1.2.0"}')
  self.assertIsNone(inspect(install));self.assertIsNone(inspect('/tmp/.mount_test'))
  with self.assertRaises(ModError):app_root('/tmp/.mount_test')
 def test_finds_app_run_and_remembered_target(self):
  install=self.install();self.assertEqual(inspect(install/'AppRun').path,install)
  remember(install,self.data);self.assertEqual([c.path for c in self.find()],[install])
 def test_finds_image_in_downloads_without_recursive_home_scan(self):
  downloads=self.home/'Descargas';downloads.mkdir();image=self.image();image=image.rename(downloads/image.name)
  self.assertEqual(self.find([downloads])[0].path,image)
 def test_deduplicates_desktop_and_saved_installation(self):
  install=self.install();remember(install,self.data)
  (self.apps/'showdown.desktop').write_text('[Desktop Entry]\nType=Application\nExec="'+str(install/'AppRun')+'"\n')
  self.assertEqual(len(self.find()),1)
 def test_reads_only_main_app_process_and_ignores_renderer(self):
  install=self.install();exe=install/'pokemon-showdown-pro.bin';exe.write_text('binary')
  main=self.proc/'100';main.mkdir();(main/'exe').symlink_to(exe);(main/'cmdline').write_bytes(str(exe).encode()+b'\0')
  child=self.proc/'101';child.mkdir();(child/'exe').symlink_to(exe);(child/'cmdline').write_bytes(str(exe).encode()+b'\0--type=renderer\0')
  terminal=self.proc/'102';terminal.mkdir();(terminal/'exe').symlink_to('/bin/sh');(terminal/'cmdline').write_bytes(b'sh\0--workdir\0showdown\0')
  self.assertEqual(list(process_targets(self.proc)),[install])
 def test_prepares_non_executable_image_without_changing_original(self):
  image=self.image();template=self.install();before=image.read_bytes();mode=image.stat().st_mode
  def extract(command,**kw):
   import shutil
   self.assertTrue(os.access(command[0],os.X_OK));shutil.copytree(template,Path(kw['cwd'])/'squashfs-root');return Mock(returncode=0)
  with patch('okayu_update.discovery.subprocess.run',side_effect=extract) as run,patch('okayu_update.discovery.Manager') as manager:
   prepared=prepare_image(image,self.data);self.assertTrue((prepared/'AppRun').is_file());manager.return_value.prepare.assert_called_once()
   self.assertEqual(prepare_image(image,self.data),prepared);self.assertEqual(run.call_count,1)
  self.assertEqual(image.read_bytes(),before);self.assertEqual(image.stat().st_mode,mode)
  self.assertEqual(self.find()[0].path,prepared)
 def test_hides_unchanged_source_but_detects_new_image(self):
  image=self.image();template=self.install()
  def extract(command,**kw):
   import shutil
   shutil.copytree(template,Path(kw['cwd'])/'squashfs-root');return Mock(returncode=0)
  with patch('okayu_update.discovery.subprocess.run',side_effect=extract),patch('okayu_update.discovery.Manager'):prepared=prepare_image(image,self.data)
  (self.apps/'showdown.desktop').write_text('[Desktop Entry]\nType=Application\nExec="'+str(image)+'"\n')
  self.assertEqual(len(self.find()),1)
  image.write_bytes(image.read_bytes()+b'new release')
  self.assertEqual(len(self.find()),2)
 def test_failed_import_leaves_source_unchanged(self):
  image=self.image();before=image.read_bytes()
  with patch('okayu_update.discovery.subprocess.run',return_value=Mock(returncode=1)):
   with self.assertRaises(ModError):prepare_image(image,self.data)
  self.assertEqual(image.read_bytes(),before);self.assertFalse((self.data/'settings.json').exists())
  self.assertFalse(list((self.data/'managed').glob('showdown-pro-*')))
 def test_shortcut_quotes_spaces_and_preserves_other_shortcuts(self):
  install=self.install('Showdown Pro 100%');desktop=create_shortcut(install,self.apps)
  self.assertEqual(desktop_targets(desktop),[install/'AppRun'])
  remove_shortcut(install,self.apps);self.assertFalse(desktop.exists())
  desktop.write_text('[Desktop Entry]\nName=custom\n')
  with self.assertRaises(ModError):create_shortcut(install,self.apps)
  self.assertIn('custom',desktop.read_text())
 def test_theme_shortcut_uses_branded_native_icon_and_window_class(self):
  install=self.install();assets=install/'resources/app/app/assets/icons';assets.mkdir(parents=True);(assets/'icon.png').write_bytes(b'png');(assets/'okayu-icon-512.png').write_bytes(b'square png')
  (install/'resources/app/app/okayu-update-installed.json').write_text('{"modules":["theme-okayu"]}')
  original=self.apps/'pokemon-showdown-pro.desktop';original.write_text('original shortcut')
  shortcut=create_shortcut(install,self.apps);text=shortcut.read_text()
  self.assertIn('Icon='+str(assets/'okayu-icon-512.png'),text);self.assertIn('StartupWMClass=pokemon-showdown-okayu-update',text)
  self.assertEqual(original.read_text(),'original shortcut')
 def test_revert_does_not_remove_another_installation_shortcut(self):
  a=self.install('one');b=self.install('two');shortcut=create_shortcut(b,self.apps)
  remove_shortcut(a,self.apps);self.assertTrue(shortcut.exists())

class GuidedSelection(unittest.TestCase):
 def test_single_detected_installation_never_asks_for_folder(self):
  from okayu_update.__main__ import choose_installation
  item=Installation(Path('/known/showdown'),'directory','1.2.0')
  with patch('okayu_update.__main__.discover',return_value=[item]),patch('okayu_update.__main__.dialog') as dialog,patch('okayu_update.__main__.remember'):
   self.assertEqual(choose_installation(True),item.path);dialog.assert_not_called()
 def test_single_image_prepares_automatically_after_confirmation(self):
  from okayu_update.__main__ import choose_installation
  item=Installation(Path('/download/Pro.AppImage'),'appimage','1.2.0')
  with patch('okayu_update.__main__.discover',return_value=[item]),patch('okayu_update.__main__.dialog') as dialog,patch('okayu_update.__main__.prepare_image',return_value=Path('/managed/showdown')) as prepare,patch('okayu_update.__main__.progress',side_effect=lambda text,fn:fn()),patch('okayu_update.__main__.remember'):
   self.assertEqual(choose_installation(True),Path('/managed/showdown'));prepare.assert_called_once_with(item.path)
   self.assertEqual(dialog.call_args.args[0],'--question')
 @unittest.skipIf(os.name=='nt','Linux AppImage picker')
 def test_no_detection_offers_appimage_instead_of_forcing_folder(self):
  from okayu_update.__main__ import choose_installation
  with patch('okayu_update.__main__.discover',return_value=[]),patch('okayu_update.__main__.dialog',return_value='folder') as dialog,patch('okayu_update.__main__.inspect',return_value=None):
   with self.assertRaises(ModError):choose_installation(True)
   self.assertIn('image',dialog.call_args_list[0].args)

if __name__=='__main__':unittest.main()
