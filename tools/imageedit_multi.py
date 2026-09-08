#!/usr/bin/env python3
"""여러 참조 이미지를 함께 넘기는 편집. gpt-image-2 의 image[] 다중 입력을 쓴다.

용도: 장면 구도는 이미지1 에서, 인물 얼굴은 이미지2(마스터) 에서 가져온다.
참조 이미지는 인물 일관성을 돕는 입력이다. 결과의 동일성을 보증하지 않으며
      외형 묘사와 이미지 참조의 효과는 모델·장면마다 검토해야 한다.

사용: tools/imageedit_multi.py <out.png> <프롬프트파일> <이미지1> <이미지2> ... [--w 864 --h 1536]
"""
import os
from runtime import binary
import argparse, base64, json, pathlib, subprocess, sys, time, urllib.error, urllib.request, uuid

ROOT = pathlib.Path(__file__).resolve().parents[1]
FFMPEG = binary("ffmpeg")
GEN_W, GEN_H = 1024, 1536


def load_key():
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise SystemExit("Set OPENAI_API_KEY in your environment before making a paid API request.")
    return key


def edit(images, prompt, model, raw_out):
    boundary = uuid.uuid4().hex
    def field(name, value):
        return (f'--{boundary}\r\nContent-Disposition: form-data; '
                f'name="{name}"\r\n\r\n{value}\r\n').encode()
    body = field("model", model) + field("prompt", prompt) + field("size", f"{GEN_W}x{GEN_H}")
    for i, path in enumerate(images):
        body += (f'--{boundary}\r\nContent-Disposition: form-data; name="image[]"; '
                 f'filename="ref{i}.png"\r\nContent-Type: image/png\r\n\r\n').encode()
        body += path.read_bytes() + b"\r\n"
    body += f"--{boundary}--\r\n".encode()
    request = urllib.request.Request(
        "https://api.openai.com/v1/images/edits", data=body,
        headers={"Authorization": f"Bearer {load_key()}",
                 "Content-Type": f"multipart/form-data; boundary={boundary}"})
    start = time.time()
    try:
        data = json.load(urllib.request.urlopen(request, timeout=900))
    except urllib.error.HTTPError as exc:
        sys.exit(f"HTTP {exc.code}: {exc.read().decode()[:600]}")
    raw_out.write_bytes(base64.b64decode(data["data"][0]["b64_json"]))
    return time.time() - start, data.get("usage", {}).get("output_tokens", 0)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("out"); ap.add_argument("prompt_file"); ap.add_argument("images", nargs="+")
    ap.add_argument("--w", type=int, default=864); ap.add_argument("--h", type=int, default=1536)
    ap.add_argument("--model", default="gpt-image-2")
    a = ap.parse_args()
    out = pathlib.Path(a.out); out.parent.mkdir(parents=True, exist_ok=True)
    if out.exists():
        print(f"SKIP {out.name}"); sys.exit(0)
    raw = out.with_name(out.stem + "_raw.png")
    images = [pathlib.Path(p) for p in a.images]
    for p in images:
        if not p.exists(): sys.exit(f"없는 파일: {p}")
    print(f"참조 {len(images)}장: {', '.join(p.name for p in images)}")
    seconds, tokens = edit(images, pathlib.Path(a.prompt_file).read_text().strip(), a.model, raw)
    crop_w = round(GEN_H * a.w / a.h)
    if crop_w <= GEN_W:
        vf = f"crop={crop_w}:{GEN_H}:{(GEN_W-crop_w)//2}:0,scale={a.w}:{a.h}:flags=lanczos"
    else:
        crop_h = round(GEN_W * a.h / a.w)
        vf = f"crop={GEN_W}:{crop_h}:0:{(GEN_H-crop_h)//2},scale={a.w}:{a.h}:flags=lanczos"
    subprocess.run([FFMPEG, "-y", "-v", "error", "-i", str(raw), "-vf", vf, str(out)], check=True)
    print(f"{out.name}  {seconds:.1f}초  출력토큰 {tokens}")
