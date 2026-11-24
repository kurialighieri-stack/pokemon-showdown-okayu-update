import hashlib,json,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'app/src/main/assets/client'
class PackagedClient(unittest.TestCase):
 def test_all_packaged_hashes(self):
  manifest=json.loads((ASSETS/'provenance.json').read_text())
  for name,expected in manifest['files'].items():
   with self.subTest(name=name):self.assertEqual(hashlib.sha256((ASSETS/name).read_bytes()).hexdigest(),expected)
 def test_no_desktop_runtime_or_glass(self):
  html=(ASSETS/'index.html').read_text()
  for forbidden in ['electron','streamer-mode','okayu-glass','file://','chrome-extension://']:self.assertNotIn(forbidden,html)
  self.assertIn('/showdex/main.js',html);self.assertIn('/okayu/plus-loader.js',html)
 def test_local_data_matches_lock(self):
  for name,expected in json.loads((ROOT/'client-data.lock.json').read_text()).items():self.assertEqual(hashlib.sha256((ASSETS/name.lstrip('/')).read_bytes()).hexdigest(),expected)
