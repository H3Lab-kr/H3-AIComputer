#!/usr/bin/env python3
"""Prepare a traceable H3 CLI job. Dry run by default; bring your own engine/model."""
import argparse, hashlib, json, subprocess
from datetime import datetime
from pathlib import Path

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--engine',type=Path,required=True);p.add_argument('--model',type=Path,required=True)
    p.add_argument('--prompt',type=Path,required=True);p.add_argument('--output',type=Path,required=True)
    p.add_argument('--first-frame',type=Path);p.add_argument('--steps',type=int,default=8)
    p.add_argument('--width',type=int,default=384);p.add_argument('--height',type=int,default=384)
    p.add_argument('--frames',type=int,default=107);p.add_argument('--seed',type=int,default=1)
    p.add_argument('--execute',action='store_true');a=p.parse_args()
    if min(a.steps,a.width,a.height,a.frames)<=0:p.error('Dimensions, frames and steps must be positive')
    if not a.engine.is_file() or not a.model.is_dir() or not a.prompt.is_file():p.error('Engine, model directory and prompt must exist')
    if a.first_frame and not a.first_frame.is_file():p.error('Reference image does not exist')
    if a.output.exists():p.error('Choose a new output directory for each job')
    a.output.mkdir(parents=True)
    prompt=a.prompt.read_text(encoding='utf-8')
    cmd=[str(a.engine.resolve()),'-d',str(a.model.resolve()),'--width',str(a.width),'--height',str(a.height),'--frames',str(a.frames),'--steps',str(a.steps),'--seed',str(a.seed),'-o',str((a.output/'output.mp4').resolve())]
    if a.first_frame:cmd+=['--first-frame',str(a.first_frame.resolve())]
    record={'created':datetime.now().astimezone().isoformat(),'command':cmd,'prompt':prompt,'engine_sha256':hashlib.sha256(a.engine.read_bytes()).hexdigest(),'model_fingerprint':'not computed; supply separately before comparisons','status':'dry_run','quality_approval':False}
    if a.first_frame:record['reference_sha256']=hashlib.sha256(a.first_frame.read_bytes()).hexdigest()
    target=a.output/'request.json';target.write_text(json.dumps(record,ensure_ascii=False,indent=2))
    if a.execute:
        with (a.output/'stdout.log').open('w') as out,(a.output/'stderr.log').open('w') as err:
            r=subprocess.run(cmd,input=prompt,text=True,stdout=out,stderr=err,cwd=a.engine.resolve().parent)
        record.update(status='process_finished',returncode=r.returncode,output_exists=(a.output/'output.mp4').is_file());target.write_text(json.dumps(record,ensure_ascii=False,indent=2))
        if r.returncode or not record['output_exists']:raise SystemExit('Generation failed; inspect local logs')
    print(target)
if __name__=='__main__':main()
