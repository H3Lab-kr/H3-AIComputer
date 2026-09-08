#!/usr/bin/env python3
"""발화 끝 갈라짐 측정.

발화 구간을 앞·중·끝 3등분해 두 지표를 낸다.
  주기성   자기상관 최댓값(60~400Hz). 성대 진동의 규칙성. 낮을수록 갈라짐.
  평탄도   200~4000Hz 스펙트럴 평탄도. 잡음에 가까울수록 높음.

끝 구간과 앞 구간의 상대적인 평탄도를 탐색한다. 음악·무음·녹음 조건의
영향을 받으므로 모델이나 스텝 수의 우열을 이 수치로 확정하지 않는다.

이 수치는 청취를 대신하지 않는다. 반드시 들어보고 판정한다.
"""
import argparse, json, subprocess
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
from runtime import binary
FFMPEG = binary('ffmpeg')
SR = 32000


def load(path):
    raw = subprocess.run(
        [str(FFMPEG), '-v', 'error', '-i', str(path), '-vn', '-ac', '1',
         '-ar', str(SR), '-f', 'f32le', '-'], stdout=subprocess.PIPE, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def frames(x, n=1024, hop=256):
    win = np.hanning(n)
    times, voicing, flatness, rms = [], [], [], []
    lo, hi = int(SR / 400), int(SR / 60)
    freqs = np.fft.rfftfreq(n, 1 / SR)
    band = (freqs >= 200) & (freqs < 4000)
    for i in range(0, x.size - n, hop):
        s = x[i:i + n] * win
        rms.append(float(np.sqrt(np.mean(s ** 2))))
        a = np.correlate(s, s, 'full')[n - 1:]
        a = a / max(a[0], 1e-12)
        voicing.append(float(a[lo:hi].max()) if hi < a.size else 0.0)
        spectrum = np.abs(np.fft.rfft(s)) + 1e-12
        b = spectrum[band]
        flatness.append(float(np.exp(np.mean(np.log(b))) / np.mean(b)))
        times.append(i / SR)
    return (np.array(times), np.array(voicing), np.array(flatness), np.array(rms))


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('video', type=Path)
    ap.add_argument('--json', type=Path)
    args = ap.parse_args()

    x = load(args.video)
    times, voicing, flatness, rms = frames(x)
    if rms.size == 0 or rms.max() <= 0:
        raise SystemExit('무음 파일')
    speech = np.flatnonzero(rms > rms.max() * 0.10)
    if speech.size < 12:
        raise SystemExit('발화 구간이 너무 짧아 판정하지 않는다')
    a, b = speech[0], speech[-1]
    span = np.arange(a, b + 1)
    k = max(1, len(span) // 3)
    thirds = {'front': span[:k], 'middle': span[k:2 * k], 'end': span[2 * k:]}
    out = {'video': str(args.video),
           'duration': round(x.size / SR, 3),
           'speech_start': round(float(times[a]), 3),
           'speech_end': round(float(times[b]), 3),
           'tail_silence': round(float(x.size / SR - times[b]), 3),
           'thirds': {}}
    for name, idx in thirds.items():
        keep = idx[rms[idx] > rms.max() * 0.10]
        if keep.size == 0:
            continue
        out['thirds'][name] = dict(periodicity=round(float(voicing[keep].mean()), 4),
                                   flatness=round(float(flatness[keep].mean()), 4),
                                   rms=round(float(rms[keep].mean()), 5))
    f = out['thirds'].get('front', {}).get('flatness')
    e = out['thirds'].get('end', {}).get('flatness')
    if f and e:
        out['flatness_end_over_front'] = round(e / max(f, 1e-9), 2)
    out['limits'] = [
        '수치는 청취를 대신하지 않는다. 반드시 들어보고 판정한다.',
        '발화 끝이 클립 경계에 붙으면 꼬리가 불안정해진다. tail_silence 를 함께 본다.',
        '설정 간 비교는 같은 프롬프트·시드에서, 복수 시드로 반복해야 한다.',
    ]
    text = json.dumps(out, ensure_ascii=False, indent=2)
    if args.json:
        args.json.parent.mkdir(parents=True, exist_ok=True)
        args.json.write_text(text + '\n')
    print(text)


if __name__ == '__main__':
    main()
