"""Package one desktop build with executable modes intact and publish checksums."""
import hashlib, os, shutil
from pathlib import Path
root = Path(__file__).resolve().parents[1]
folders = list((root / 'apps/desktop/dist').glob('H3 AI Computer-*'))
assert len(folders) == 1, 'Expected one target build'
output = root / 'release'
output.mkdir(exist_ok=True)
name = os.environ['H3_ASSET']
fmt = 'zip' if 'Windows' in name else 'gztar'
archive = Path(shutil.make_archive(str(output / name), fmt, root_dir=folders[0].parent, base_dir=folders[0].name))
archive.with_name(archive.name + '.sha256').write_text(hashlib.sha256(archive.read_bytes()).hexdigest() + '  ' + archive.name + '\n')
print(archive)
