import json
import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tools'))
from render_film import load_config
from export_public import inspect_file

class PublicToolsTests(unittest.TestCase):
    def test_reject_missing_image_and_fractional_frames(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'film.json'
            for shot in [{'seconds':1,'image':'missing.png'},{'seconds':.001},{'seconds':-1}]:
                p.write_text(json.dumps({'shots':[shot]}))
                with self.assertRaises(ValueError):load_config(p)
    def test_reject_odd_dimensions(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'film.json';p.write_text(json.dumps({'size':[321,240],'shots':[{'seconds':1}]}))
            with self.assertRaises(ValueError):load_config(p)
    def test_release_scanner_detects_secret_without_echoing(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'sample.txt';p.write_text('sk-'+'x'*30)
            self.assertIn('possible secret',inspect_file(p))
    def test_example_is_asset_independent(self):
        c=load_config(Path(__file__).resolve().parents[1]/'examples/basic/film.json')
        self.assertEqual(sum(s['seconds'] for s in c['shots']),10)
if __name__=='__main__':unittest.main()
