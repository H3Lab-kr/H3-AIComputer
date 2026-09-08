#!/usr/bin/env python3
"""Original 30-second electronic score. Standard library; no sampled recordings."""
import array, math, random, sys, wave
from pathlib import Path
output = Path(sys.argv[1] if len(sys.argv)>1 else 'h3-score.wav')
if output.exists(): raise SystemExit('Choose a new output file')
output.parent.mkdir(parents=True, exist_ok=True)
sr=48000; seconds=30; bpm=112; beat=60/bpm; bar=4*beat
chords=[(50,54,57,61),(45,49,52,57),(47,50,54,57),(43,47,50,54)]
freq=lambda n:440*2**((n-69)/12)
rng=random.Random(30909); samples=array.array('h')
for i in range(sr*seconds):
 t=i/sr; b=int(t/bar); p=t%bar; notes=chords[b%4]
 padenv=min(1,p/.25,(bar-p)/.3)
 pad=sum(math.sin(2*math.pi*freq(n+12)*t)+.16*math.sin(2*math.pi*freq(n+24)*t) for n in notes)*.024*padenv
 eighth=int(t/(beat/2)); ph=t%(beat/2); n=notes[[0,2,1,3,2,1,3,2][eighth%8]]+24
 f=freq(n); pluck=(math.sin(2*math.pi*f*ph)+.25*math.sin(4*math.pi*f*ph))*math.exp(-ph*13)*.095
 bp=t%(2*beat); bass=math.sin(2*math.pi*freq(notes[0]-12)*bp)*math.exp(-bp*3)*.10
 kp=t%beat; kick=math.sin(2*math.pi*(48*kp+3*(1-math.exp(-kp*28))))*math.exp(-kp*24)*.08*(min(1,t/4))
 hat=(rng.random()*2-1)*math.exp(-ph*180)*.012*min(1,t/8)
 fade=min(1,t/1.5,max(0,(seconds-t)/2.6)); mid=(pad+pluck+bass+kick+hat)*fade
 width=pad*.12*math.sin(t*.63)
 samples.extend([int(max(-.95,min(.95,mid+width))*32767),int(max(-.95,min(.95,mid-width))*32767)])
with wave.open(str(output),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes(samples.tobytes())
print(output)
