#!/usr/bin/env python3
"""참조 없는 영상·음성 품질 지표.

무엇을 재는가
  temporal      프레임 간 휘도 점프 수 (시간축 찢어짐·디졸브 탐지)
  flicker       프레임 간 차이의 중앙값 (맥동 탐지)
  stability     지정 영역의 구조 에너지 변동 (인물 붕괴를 보증해 탐지하지 않음)
  lipsync       음성 포락선과 입 영역 움직임의 정렬 마진
  ab            대조군이 있을 때 SSIM/DSSIM (같은 궤적일 때만 유효)

무엇을 재지 못하는가
  매력, 연출, 목소리 품질, 의도 충실도. 이 지표 전부를 통과해도 사람이 보고
  판정해야 한다. 지표는 큰 실패를 걸러내는 용도다.

의존성: numpy, FFmpeg, FFprobe. ASR 결과 JSON은 별도로 준비한다.
"""
import argparse, json, subprocess, sys
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
from runtime import binary
FFMPEG = binary('ffmpeg')
FFPROBE = binary('ffprobe')


def probe(path):
    out = subprocess.check_output([str(FFPROBE), '-v', 'error', '-show_streams',
                                   '-show_format', '-of', 'json', str(path)], text=True)
    j = json.loads(out)
    v = next(s for s in j['streams'] if s['codec_type'] == 'video')
    a = next((s for s in j['streams'] if s['codec_type'] == 'audio'), None)
    num, den = map(int, v['avg_frame_rate'].split('/'))
    return dict(width=int(v['width']), height=int(v['height']), fps=num / den,
                duration=float(j['format']['duration']),
                has_audio=a is not None,
                sample_rate=int(a['sample_rate']) if a else 0)


def read_gray(path, width):
    """그레이스케일 프레임을 [n, h, w] float32 (0..1) 로 읽는다. 폭만 지정하고 비율 유지."""
    meta = probe(path)
    height = int(round(width * meta['height'] / meta['width']))
    height -= height % 2
    raw = subprocess.run(
        [str(FFMPEG), '-v', 'error', '-i', str(path), '-vf', f'scale={width}:{height}',
         '-pix_fmt', 'gray', '-f', 'rawvideo', '-'],
        stdout=subprocess.PIPE, check=True).stdout
    frames = np.frombuffer(raw, dtype=np.uint8)
    n = frames.size // (width * height)
    if n == 0:
        raise ValueError('no frames decoded')
    return frames[:n * width * height].reshape(n, height, width).astype(np.float32) / 255.0, meta


def read_audio(path, rate=16000):
    raw = subprocess.run(
        [str(FFMPEG), '-v', 'error', '-i', str(path), '-vn', '-ac', '1', '-ar', str(rate),
         '-f', 'f32le', '-'], stdout=subprocess.PIPE, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def robust_threshold(deltas, k=6.0):
    """자기 자신의 잡음 바닥에서 임계를 세운다. 절대 임계값을 쓰지 않는다."""
    median = float(np.median(deltas))
    mad = float(np.median(np.abs(deltas - median)))
    # 정규분포에서 MAD*1.4826 = 표준편차
    return median + k * mad * 1.4826, median, mad


def temporal_metrics(gray):
    """휘도 점프와 맥동. PR #57 의 luma jump 계수와 같은 개념."""
    luma = gray.mean(axis=(1, 2))
    dl = np.abs(np.diff(luma))
    thr, med, mad = robust_threshold(dl)
    jumps = np.flatnonzero(dl > thr)
    frame_diff = np.abs(np.diff(gray, axis=0)).mean(axis=(1, 2))
    return dict(
        luma_jump_count=int(jumps.size),
        luma_jump_frames=[int(i) + 1 for i in jumps[:40]],
        luma_jump_threshold=round(thr, 6),
        luma_delta_median=round(med, 6),
        luma_delta_mad=round(mad, 6),
        flicker_median=round(float(np.median(frame_diff)), 6),
        flicker_p95=round(float(np.percentile(frame_diff, 95)), 6),
        flicker_ratio_p95_median=round(float(np.percentile(frame_diff, 95) /
                                             max(np.median(frame_diff), 1e-9)), 3),
    )


def box_slice(shape, box):
    h, w = shape
    x0, y0, x1, y1 = box
    return slice(int(y0 * h), max(int(y1 * h), int(y0 * h) + 1)), \
           slice(int(x0 * w), max(int(x1 * w), int(x0 * w) + 1))


def stability_metrics(gray, box):
    """지정 영역의 구조 에너지 변동. 인물 붕괴·이중 얼굴은 에너지를 튀게 만든다."""
    ys, xs = box_slice(gray.shape[1:], box)
    region = gray[:, ys, xs]
    gy = np.abs(np.diff(region, axis=1)).mean(axis=(1, 2))
    gx = np.abs(np.diff(region, axis=2)).mean(axis=(1, 2))
    energy = gy + gx
    mean = float(energy.mean())
    thr, med, mad = robust_threshold(np.abs(np.diff(energy)))
    return dict(
        box=list(box),
        structure_energy_mean=round(mean, 6),
        structure_energy_cv=round(float(energy.std() / max(mean, 1e-9)), 4),
        structure_jump_count=int(np.count_nonzero(np.abs(np.diff(energy)) > thr)),
    )


def envelope(signal, n_out):
    """신호를 n_out 개 구간의 RMS 포락선으로 만든다."""
    if signal.size < n_out:
        signal = np.pad(signal, (0, n_out - signal.size))
    edges = np.linspace(0, signal.size, n_out + 1).astype(int)
    return np.array([float(np.sqrt(np.mean(signal[a:b] ** 2)) if b > a else 0.0)
                     for a, b in zip(edges[:-1], edges[1:])], dtype=np.float64)


def detrend(x, window):
    """이동평균을 빼서 느린 추세를 제거한다.

    말소리의 음절 속도는 대략 2~8 Hz 다. 추세를 빼지 않으면 '문장이 시작되며
    소리와 움직임이 함께 커지는' 느린 성분이 상관을 지배하고, 그 성분은 시간을
    옮겨도 잘 맞으므로 정렬 마진이 무의미해진다.
    """
    window = max(3, int(window) | 1)
    kernel = np.ones(window) / window
    padded = np.pad(x, (window // 2, window // 2), mode='edge')
    return x - np.convolve(padded, kernel, mode='valid')[:x.size]


def correlate(a, b):
    a = a - a.mean(); b = b - b.mean()
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    return float(a @ b / denom) if denom > 1e-12 else 0.0


def lipsync_metrics(gray, audio, fps, box, rng_seed=0):
    """음성 포락선과 입 벌림 대용치의 정렬을 순열 검정으로 판정한다.

    설계 근거(2026-09-06 실측):
      프레임 간 차이는 입 벌림의 *미분*이라 포락선과 위상이 90도 어긋난다.
      실제로 세 클립 모두 r = -0.10 ~ -0.38 의 음의 상관이 나왔다.
      벌림 자체의 대용치(구조 에너지, 어두움)로 바꾸자 +0.07 ~ +0.33 이 됐다.

    널 분포는 0.5초 이상 순환 이동한 포락선 200개의 |r| 95분위다.
    여러 지연의 최댓값을 대조군으로 쓰면 다중비교로 부풀어 항상 음수가 된다.

    마진이 0 이하면 '정렬 증거 없음'이다. 립싱크 불량 판정이 아니며,
    상자가 입에서 벗어났거나 화면에 얼굴이 없을 때도 그렇게 나온다.
    """
    if audio.size == 0:
        return dict(available=False, reason='no audio')
    ys, xs = box_slice(gray.shape[1:], box)
    region = gray[:, ys, xs]
    if region.shape[1] < 3 or region.shape[2] < 3:
        return dict(available=False, reason='box too small at analysis resolution')
    env = envelope(np.abs(audio), region.shape[0])
    window = max(3, int(round(fps * 0.5)))
    env_d = detrend(env, window)
    signals = {
        'structure': (np.abs(np.diff(region, axis=1)).mean(axis=(1, 2)) +
                      np.abs(np.diff(region, axis=2)).mean(axis=(1, 2))),
        'darkness': 1.0 - region.mean(axis=(1, 2)),
    }
    rng = np.random.default_rng(rng_seed)
    n = region.shape[0]
    lo = int(round(fps * 0.5))
    result = dict(available=True, box=list(box), detrend_window_frames=window,
                  null='circular shift >= 0.5s, 95th percentile of |r|')
    best = None
    for name, raw in signals.items():
        sig = detrend(raw, window)
        r = correlate(env_d, sig)
        if n - 2 * lo > 1:
            shifts = rng.choice(np.arange(lo, n - lo),
                                size=min(200, n - 2 * lo), replace=False)
            null = np.percentile([abs(correlate(np.roll(env_d, int(s)), sig))
                                  for s in shifts], 95)
        else:
            null = 1.0
        margin = r - float(null)
        result[name] = dict(correlation=round(r, 4), null_p95=round(float(null), 4),
                            margin=round(margin, 4))
        best = margin if best is None else max(best, margin)
    result['margin'] = round(best, 4)
    result['sync_evidence'] = bool(best > 0.05)
    result['note'] = ('두 대용치 중 큰 값을 마진으로 쓴다. 후보가 둘뿐이라 부풀림은 작지만 '
                      '경계값(0.05 부근)은 단독 근거로 쓰지 않는다.')
    return result


def normalize_korean(text):
    """비교용 정규화: 공백·문장부호 제거, 소문자화. 한글 자모 분해는 하지 않는다."""
    keep = []
    for ch in text:
        if ch.isalnum():
            keep.append(ch.lower())
    return ''.join(keep)


def edit_distance(a, b):
    if len(a) < len(b): a, b = b, a
    previous = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        current = [i]
        for j, cb in enumerate(b, 1):
            current.append(min(previous[j] + 1, current[j - 1] + 1,
                               previous[j - 1] + (ca != cb)))
        previous = current
    return previous[-1]


def dialogue_metrics(expected, asr_text, keywords=None):
    """요청 대사 대비 전사 정확도.

    Swift 저장소가 Prefix-2 부분 캐시를 기각한 근거가 이 지표다. 속도는 7.2%
    빨라졌으나 요청 대사 키워드가 5/5 에서 0/5 로 무너졌다. 전사가 맞아도
    목소리 품질·억양·립싱크를 보장하지 않는다.
    """
    exp, got = normalize_korean(expected), normalize_korean(asr_text)
    distance = edit_distance(exp, got)
    cer = distance / max(len(exp), 1)
    words = keywords if keywords else [w for w in expected.split() if len(w) > 1]
    found = [w for w in words if normalize_korean(w) and normalize_korean(w) in got]
    return dict(expected=expected, transcribed=asr_text,
                character_error_rate=round(cer, 4),
                edit_distance=distance, expected_chars=len(exp),
                keyword_recall=f'{len(found)}/{len(words)}' if words else 'n/a',
                keywords_found=found,
                keywords_missing=[w for w in words if w not in found],
                note='전사 일치는 음성 품질·억양·립싱크의 보증이 아니다.')


def ab_metrics(path, control):
    """대조군 대비 SSIM/DSSIM. 궤적이 다른 장면끼리 비교하면 무효다."""
    proc = subprocess.run(
        [str(FFMPEG), '-v', 'error', '-i', str(path), '-i', str(control),
         '-lavfi', '[0:v][1:v]ssim=stats_file=-', '-f', 'null', '-'],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    values = []
    for line in proc.stdout.splitlines():
        for token in line.split():
            if token.startswith('All:'):
                try:
                    values.append(float(token.split(':')[1]))
                except ValueError:
                    pass
    if not values:
        return dict(available=False, reason='ssim produced no frames (size or length mismatch?)')
    ssim = float(np.mean(values))
    dssim = (1.0 - ssim) / 2.0
    return dict(available=True, frames=len(values),
                ssim_mean=round(ssim, 5), ssim_min=round(float(np.min(values)), 5),
                dssim=round(dssim, 5),
                detail_comparison_valid=bool(dssim <= 0.01),
                rule='dssim > 0.01 이면 두 클립은 궤적이 달라 디테일 비교를 무효로 본다')


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('video', type=Path)
    ap.add_argument('--control', type=Path, help='A/B 대조군 (같은 프롬프트·시드 권장)')
    ap.add_argument('--face-box', default='0.30,0.15,0.70,0.60',
                    help='x0,y0,x1,y1 비율. 기본값은 세로 토킹헤드 기준')
    ap.add_argument('--mouth-box', default='0.35,0.35,0.65,0.62',
                    help='립싱크용 입 주변 영역 비율')
    ap.add_argument('--analysis-width', type=int, default=192)
    ap.add_argument('--expect-dialogue', help='요청한 대사 원문')
    ap.add_argument('--asr', type=Path, help='mlx_whisper 결과 JSON (text 필드 사용)')
    ap.add_argument('--keywords', help='쉼표로 구분한 필수 키워드')
    ap.add_argument('--json', type=Path, help='결과 저장 경로')
    args = ap.parse_args()

    face = tuple(float(x) for x in args.face_box.split(','))
    mouth = tuple(float(x) for x in args.mouth_box.split(','))
    gray, meta = read_gray(args.video, args.analysis_width)
    audio = read_audio(args.video) if meta['has_audio'] else np.zeros(0, np.float32)

    report = dict(
        video=str(args.video),
        media=dict(width=meta['width'], height=meta['height'], fps=round(meta['fps'], 3),
                   duration=round(meta['duration'], 3), frames_analyzed=int(gray.shape[0]),
                   analysis_resolution=[int(gray.shape[2]), int(gray.shape[1])]),
        temporal=temporal_metrics(gray),
        stability=stability_metrics(gray, face),
        lipsync=lipsync_metrics(gray, audio, meta['fps'], mouth),
        limits=[
            '모든 임계는 클립 자체의 잡음 바닥에서 세운 상대 기준이다. 절대 합격선이 아니다.',
            '이 지표는 큰 실패 탐지용이다. 매력·연출·목소리·의도 충실도를 판정하지 않는다.',
            '영역 상자는 프레이밍에 따라 지정해야 한다. 잘못된 상자는 조용히 0 을 낸다.',
            '단일 클립 수치로 설정 간 우열을 정하지 않는다. 반복과 복수 시드가 필요하다.',
            '유령·이중 얼굴·인물 분신은 이 도구가 탐지하지 못한다. 2026-09-06 에 휘도 점프, '
            '구조 에너지 변동, 자기유사도 부(副)피크 세 가지로 시도했고 모두 실패했다. '
            '알려진 유령 클립이 통과 클립보다 오히려 낮은 값을 낸 경우도 있었다. 사람이 봐야 한다.',
        ])
    if args.expect_dialogue and args.asr:
        asr = json.loads(args.asr.read_text())
        report['dialogue'] = dialogue_metrics(
            args.expect_dialogue, asr.get('text', ''),
            [k.strip() for k in args.keywords.split(',')] if args.keywords else None)
    if args.control:
        report['ab'] = ab_metrics(args.video, args.control)
        report['ab']['control'] = str(args.control)

    text = json.dumps(report, ensure_ascii=False, indent=2)
    if args.json:
        args.json.parent.mkdir(parents=True, exist_ok=True)
        args.json.write_text(text + '\n')
    print(text)


if __name__ == '__main__':
    main()
