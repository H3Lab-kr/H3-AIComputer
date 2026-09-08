#!/usr/bin/env python3
"""Explicit, billable Gemini TTS request. No API call occurs on import or --help."""
import argparse, base64, hashlib, json, os, time, wave
from pathlib import Path
import requests

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('script',type=Path);p.add_argument('--output',type=Path,required=True)
    p.add_argument('--model',required=True,help='Provider model ID; verify availability in your account')
    p.add_argument('--voice',default='Sulafat');p.add_argument('--direction',default='Read naturally and clearly. Voice only; no music.')
    a=p.parse_args();key=os.environ.get('GEMINI_API_KEY')
    if not key: p.error('Set GEMINI_API_KEY in your environment')
    if a.output.exists():p.error('Output exists; choose a new filename')
    prompt=a.direction+'\n\n'+a.script.read_text(encoding='utf-8')
    payload={'contents':[{'parts':[{'text':prompt}]}],'generationConfig':{'responseModalities':['AUDIO'],'speechConfig':{'voiceConfig':{'prebuiltVoiceConfig':{'voiceName':a.voice}}}}}
    t=time.monotonic()
    response=requests.post(f'https://generativelanguage.googleapis.com/v1beta/models/{a.model}:generateContent',headers={'x-goog-api-key':key},json=payload,timeout=180)
    if response.status_code!=200:raise SystemExit(f'TTS request failed: HTTP {response.status_code}; provider response withheld to avoid leaking request details')
    result=response.json();parts=result.get('candidates',[{}])[0].get('content',{}).get('parts',[])
    blobs=[x['inlineData'] for x in parts if 'inlineData' in x]
    if not blobs or any('audio/' not in b.get('mimeType','') or 'rate=24000' not in b.get('mimeType','') for b in blobs):
        raise SystemExit('Unexpected audio format; expected raw 24 kHz PCM. No WAV written.')
    data=b''.join(base64.b64decode(b['data'],validate=True) for b in blobs)
    if len(data)%2 or not data:raise SystemExit('Invalid 16-bit PCM payload')
    a.output.parent.mkdir(parents=True,exist_ok=True)
    with wave.open(str(a.output),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(24000);w.writeframes(data)
    a.output.with_suffix('.json').write_text(json.dumps({'model':a.model,'voice':a.voice,'prompt':prompt,'elapsed_seconds':time.monotonic()-t,'duration':len(data)/48000,'sha256':hashlib.sha256(a.output.read_bytes()).hexdigest(),'review':'pending'},ensure_ascii=False,indent=2),encoding='utf-8')
    print(a.output)
if __name__=='__main__':main()
