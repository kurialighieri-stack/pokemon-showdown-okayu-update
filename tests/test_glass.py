import os
import shutil,subprocess,unittest
from pathlib import Path
@unittest.skipIf(os.name=='nt','Glass is excluded on Windows')
class Glass(unittest.TestCase):
 @unittest.skipUnless(shutil.which('node'),'Node is needed for Glass preference tests')
 def test_settings_and_system_preferences(self):
  result=subprocess.run(['node','--test',str(Path(__file__).with_name('glass-unit.cjs'))],text=True,capture_output=True)
  self.assertEqual(result.returncode,0,result.stdout+result.stderr)
