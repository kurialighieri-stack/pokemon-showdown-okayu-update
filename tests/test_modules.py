import hashlib,json,struct,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class ModuleComposition(unittest.TestCase):
 def test_all_payload_hashes_match(self):
  for manifest in (ROOT/'modules').glob('*/addon.json'):
   module=json.loads(manifest.read_text(encoding='utf-8'));payloads=dict(module['files'])
   for extra in module.get('platformFiles',{}).values():payloads.update(extra)
   for name,expected in payloads.items():
    with self.subTest(module=manifest.parent.name,file=name):self.assertEqual(hashlib.sha256((manifest.parent/'files'/name).read_bytes()).hexdigest(),expected)
 def test_okayu_palette_composes_with_optimized_streamer(self):
  theme=json.loads((ROOT/'modules/theme-okayu/addon.json').read_text())
  self.assertNotIn('app/streamer-mode.cjs',theme['files'])
  text=(ROOT/'modules/performance/files/app/streamer-mode.cjs').read_text()
  for change in theme['edits']:
   if change['path']=='app/streamer-mode.cjs':
    self.assertEqual(text.count(change['find']),1);text=text.replace(change['find'],change['replace'])
  self.assertIn('okayu:[33,29,44,255]',text);self.assertIn('this.pendingSequence){this.schedule',text)
 def test_native_icon_is_square_transparent_png(self):
  p=ROOT/'modules/theme-okayu/files/app/assets/icons/icon.png';data=p.read_bytes()
  self.assertEqual(data[:8],b'\x89PNG\r\n\x1a\n');self.assertEqual(struct.unpack('>II',data[16:24]),(512,512));self.assertEqual(data[25],6)
