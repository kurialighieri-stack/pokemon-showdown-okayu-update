import shutil,subprocess,unittest
from pathlib import Path
class Streamer(unittest.TestCase):
 @unittest.skipUnless(shutil.which('node'),'Node is needed for streamer pixel tests')
 def test_pixels_capture_privacy_and_backpressure(self):
  result=subprocess.run(['node','--test',str(Path(__file__).with_name('streamer-unit.cjs'))],text=True,capture_output=True)
  self.assertEqual(result.returncode,0,result.stdout+result.stderr)
