#!/usr/bin/env python3
"""Build a new, history-free release tree from the explicit public manifest."""
import argparse, hashlib, json, re, shutil, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PATTERNS=[re.compile(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),re.compile(rb'\bsk-[A-Za-z0-9_-]{24,}'),re.compile(rb'\bAIza[A-Za-z0-9_-]{30,}'),re.compile(rb'\bgh[pousr]_[A-Za-z0-9]{30,}')]
PRIVATE={'productions','models','vendor','legacy','_preserved','samples','demos','audit','sources','bin','.git'}
def inspect_file(path):
    data=path.read_bytes();issues=[]
    if len(data)>2_000_000:
        manifest_path=ROOT/'public-assets.json'
        assets=json.loads(manifest_path.read_text()) if manifest_path.is_file() else {}
        try:name=str(path.resolve().relative_to(ROOT))
        except ValueError:name=''
        asset=assets.get(name,{})
        if not (len(data)<=asset.get('max_bytes',0) and hashlib.sha256(data).hexdigest()==asset.get('sha256')):
            issues.append('oversize source file or unverified public asset')
    if any(p.search(data) for p in PATTERNS):issues.append('possible secret')
    if b'/' + b'Users/' in data or b'/' + b'home/' in data:issues.append('absolute workstation path')
    return issues

def export(destination):
    names=json.loads((ROOT/'public-files.json').read_text())
    if not names or len(names)!=len(set(names)):raise ValueError('Empty or duplicate manifest entries')
    for name in names:
        rel=Path(name);src=ROOT/rel
        if rel.is_absolute() or '..' in rel.parts or rel.parts[0] in PRIVATE or src.is_symlink() or not src.is_file():raise ValueError('Invalid public entry: '+name)
        if not src.resolve().is_relative_to(ROOT):raise ValueError('File outside repository')
        issues=inspect_file(src)
        if issues:raise ValueError(name+': '+', '.join(issues))
    if destination.exists():raise ValueError('Destination exists; use a fresh directory')
    destination.mkdir(parents=True)
    for name in names:
        target=destination/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(ROOT/name,target)
    report={'files':{n:hashlib.sha256((destination/n).read_bytes()).hexdigest() for n in names},'history_included':False,'credentials_included':False,'license_present':(destination/'LICENSE').is_file(),'limits':'Pattern scan is heuristic, not a guarantee. Inspect the exact export before publishing.'}
    (destination/'PUBLIC-EXPORT.json').write_text(json.dumps(report,indent=2))
    print(json.dumps({'files':len(names),'output':str(destination),'license_present':report['license_present']},indent=2))
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('destination',type=Path);a=p.parse_args();export(a.destination.resolve())
