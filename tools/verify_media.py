#!/usr/bin/env python3
"""Verify media structure and complete decode, without claiming visual quality."""
import argparse, hashlib, json, subprocess
from pathlib import Path
from runtime import binary

def verify(path):
    meta=json.loads(subprocess.check_output([binary('ffprobe'),'-v','error','-count_frames','-show_streams','-show_format','-of','json',str(path)],text=True))
    subprocess.run([binary('ffmpeg'),'-v','error','-xerror','-i',str(path),'-f','null','-'],check=True,stdout=subprocess.DEVNULL)
    return {'file':path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'media':meta,'full_decode':'pass','perceptual_quality':'not evaluated','human_review':'pending'}
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('media',type=Path);p.add_argument('--json',type=Path);a=p.parse_args();s=json.dumps(verify(a.media),ensure_ascii=False,indent=2)
    if a.json:a.json.parent.mkdir(parents=True,exist_ok=True);a.json.write_text(s)
    else:print(s)
