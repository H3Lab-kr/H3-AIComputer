#!/usr/bin/env python3
"""Render a local, declarative photo/caption film. Never calls a generation API."""
import argparse
import hashlib
import html
import json
import math
import subprocess
import tempfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps
from runtime import binary

def load_config(path):
    cfg = json.loads(path.read_text(encoding='utf-8'))
    w, h = cfg.get('size', [1280, 720]); fps = cfg.get('fps', 24)
    if not all(isinstance(v, int) and v > 0 for v in [w, h, fps]) or w % 2 or h % 2:
        raise ValueError('size must contain positive even integers; fps must be a positive integer')
    shots = cfg.get('shots', [])
    if not shots:
        raise ValueError('At least one shot is required')
    for shot in shots:
        duration = shot.get('seconds', 5)
        if not isinstance(duration, (int, float)) or not math.isfinite(duration) or duration <= 0:
            raise ValueError('Shot duration must be positive and finite')
        if abs(duration * fps - round(duration * fps)) > 1e-6:
            raise ValueError('Shot duration must align to whole frames')
        if shot.get('image') and not (path.parent / shot['image']).is_file():
            raise ValueError('Missing shot image')
    return cfg

def render(config, output, font_path=None, ffmpeg=None):
    cfg = load_config(config); w,h = cfg.get('size', [1280,720]); fps=cfg.get('fps',24)
    ffmpeg = ffmpeg or binary('ffmpeg'); output.mkdir(parents=True, exist_ok=True)
    if (output/'final.mp4').exists():
        raise ValueError('Output already exists; choose a new run directory')
    face = font_path or cfg.get('font')
    if face and not Path(face).is_absolute(): face = str(config.parent/face)
    def font(size):
        return ImageFont.truetype(face, size) if face else ImageFont.load_default(size=size)
    title_font=font(round(h*.065)); small_font=font(round(h*.03))
    nframes=sum(round(s.get('seconds',5)*fps) for s in cfg['shots']); total=nframes/fps
    sources=[]
    for shot in cfg['shots']:
        if shot.get('image'):
            src=config.parent/shot['image']; sources.append({'path':shot['image'],'sha256':hashlib.sha256(src.read_bytes()).hexdigest()})
    with tempfile.TemporaryDirectory(prefix='h3lab-render-') as tmp:
        silent=Path(tmp)/'silent.mp4'
        cmd=[ffmpeg,'-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{w}x{h}','-r',str(fps),'-i','-','-an','-c:v','libx264','-crf','18','-pix_fmt','yuv420p',str(silent)]
        proc=subprocess.Popen(cmd,stdin=subprocess.PIPE)
        try:
            k=0
            for shot in cfg['shots']:
                count=round(shot.get('seconds',5)*fps)
                base=ImageOps.fit(Image.open(config.parent/shot['image']).convert('RGB'),(w,h)) if shot.get('image') else Image.new('RGB',(w,h),shot.get('background','#122b39'))
                for j in range(count):
                    z=1+.035*j/max(1,count-1);sw,sh=round(w*z),round(h*z)
                    im=base.resize((sw,sh)).crop(((sw-w)//2,(sh-h)//2,(sw+w)//2,(sh+h)//2)).convert('RGBA')
                    overlay=Image.new('RGBA',(w,h));d=ImageDraw.Draw(overlay)
                    d.rectangle((0,h*.65,w,h),fill=(5,20,30,205));im=Image.alpha_composite(im,overlay).convert('RGB');d=ImageDraw.Draw(im)
                    title=shot.get('title',''); subtitle=shot.get('subtitle','')
                    for text,f in [(title,title_font),(subtitle,small_font)]:
                        if d.textlength(text,font=f)>w*.88:raise ValueError('Caption exceeds safe width; shorten text or reduce size')
                    d.text((w*.06,h*.71),title,font=title_font,fill='#fff9ee')
                    d.text((w*.06,h*.84),subtitle,font=small_font,fill='#80dfc5')
                    if k==nframes-1: im.save(output/'thumbnail.jpg',quality=93)
                    proc.stdin.write(im.tobytes());k+=1
            proc.stdin.close()
            if proc.wait()!=0:raise RuntimeError('Visual encoding failed')
        finally:
            if proc.poll() is None:proc.kill();proc.wait()
        audio=cfg.get('audio')
        cmd=[ffmpeg,'-v','error','-y','-i',str(silent)]
        if audio:
            ap=config.parent/audio
            if not ap.is_file():raise ValueError('Missing audio file')
            sources.append({'path':audio,'sha256':hashlib.sha256(ap.read_bytes()).hexdigest()})
            cmd+=['-i',str(ap),'-map','0:v','-map','1:a','-af',f'apad,atrim=duration={total},loudnorm=I=-16:TP=-1.5:LRA=9','-c:a','aac','-b:a','192k']
        else:cmd+=['-an']
        cmd+=['-c:v','copy','-t',str(total),'-movflags','+faststart',str(output/'final.mp4')]
        subprocess.run(cmd,check=True)
    label=html.escape(cfg.get('title','Video preview'))
    (output/'index.html').write_text(f'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{label}</title><style>body{{margin:40px auto;max-width:1000px;padding:0 20px;background:#122b39;color:white;font-family:system-ui}}video{{width:100%}}a{{color:#80dfc5}}</style><h1>{label}</h1><video controls playsinline poster="thumbnail.jpg" src="final.mp4"></video><p><a href="final.mp4" download>Download video</a></p></html>',encoding='utf-8')
    record={'config':cfg,'input_hashes':sources,'frames':nframes,'duration':total,'output_sha256':hashlib.sha256((output/'final.mp4').read_bytes()).hexdigest(),'type':'photo/caption motion edit; no model inference','human_review':'pending'}
    (output/'render.json').write_text(json.dumps(record,ensure_ascii=False,indent=2),encoding='utf-8')
    print(output/'index.html')

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('config',type=Path);p.add_argument('--output',required=True,type=Path);p.add_argument('--font');p.add_argument('--ffmpeg');a=p.parse_args()
    render(a.config.resolve(),a.output.resolve(),a.font,a.ffmpeg)
