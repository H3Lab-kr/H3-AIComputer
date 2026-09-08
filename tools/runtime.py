"""Portable local runtime discovery; no credentials or media are bundled."""
import os
import shutil
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
def binary(name):
    return os.environ.get(name.upper()) or shutil.which(name) or str(ROOT / 'bin' / name)
