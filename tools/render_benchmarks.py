#!/usr/bin/env python3
"""Render a local benchmark folder without inventing missing measurements."""
import argparse,json,html,statistics
from pathlib import Path

def render(root):
    esc=html.escape; cards=[]
    for kind,label in [('tts','한국어 음성'),('image','이미지'),('llm','한국어 대화')]:
        paths=sorted(root.glob(kind+'*/metrics.json'),key=lambda p:p.stat().st_mtime)
        successful=[p for p in paths if json.loads(p.read_text()).get('status')=='generated_unreviewed']
        path=(successful or paths or [None])[-1]
        body='<p class="muted">다운로드 또는 실행 준비 중 · 아직 측정값 없음</p>'
        if path:
            m=json.loads(path.read_text());rows=m.get('runs',[])
            body='<p>'+esc(m['status'])+'</p>'
            if m.get('error'):body+='<pre>'+esc(m['error'])+'</pre>'
            if 'load_seconds' in m:body+=f'<p>로딩·준비 {m["load_seconds"]:.2f}초 <span class="muted">(라이브러리 import 포함)</span></p>'
            body+='<table><tr><th>요청</th><th>완료 시간</th><th>추가 측정</th></tr>'
            for row in rows:
                extra=''
                if kind=='tts':extra=f'음성 {row["audio_seconds"]:.2f}초 · RTF {row["real_time_factor"]:.3f}'
                elif kind=='llm':extra=f'{row["generation_tokens_per_second"]:.2f} token/s · {row["generation_tokens"]} tokens'
                elif kind=='image':
                    cfg=m.get('settings',{});extra=f'{cfg.get("width","?")} × {cfg.get("height","?")} · {cfg.get("num_inference_steps","?")}스텝'
                body+=f'<tr><td>{"첫 요청" if row["run"]==1 else "상주 반복 " + str(row["run"]-1)}</td><td>{row["request_seconds"]:.2f}초</td><td>{extra}</td></tr>'
            body+='</table>'
            if rows:
                src=esc(str((path.parent/rows[0]['artifact']).relative_to(root)),quote=True)
                if kind=='tts':body+=f'<audio controls src="{src}"></audio>'
                elif kind=='image':body+=f'<img src="{src}" alt="실제 생성 이미지">'
                else:body+='<pre>'+esc((path.parent/rows[0]['artifact']).read_text())+'</pre>'
                body+=f'<p><a href="{src}">첫 결과 열기</a> · <a href="{esc(str(path.relative_to(root)))}">전체 측정 기록</a></p>'
            if len(paths)>1:body+='<details><summary>이전 시도 기록</summary>'+''.join(f'<p><a href="{esc(str(p.relative_to(root)))}">{esc(str(p.parent.name))}</a></p>' for p in paths if p!=path)+'</details>'
        cards.append(f'<section><h2>{label}</h2>{body}</section>')
    h3root=root/'h3-shift6' if (root/'h3-shift6/h3-metrics.json').exists() else root
    path=h3root/'h3-metrics.json'
    if path.exists():
        m=json.loads(path.read_text());cmd=m['runs'][0]['command']
        def flag(name):return cmd[cmd.index(name)+1] if name in cmd else '?'
        body=f'<p>{esc(flag("--width"))} × {esc(flag("--height"))} · {esc(flag("--frames"))}프레임 · {esc(flag("--steps"))}스텝</p>'
        body+='<p>'+esc(m.get('configuration_status', 'video/audio shift '+str(m.get('video_shift','?'))+'/'+str(m.get('audio_shift','?'))))+'</p>'
        body+='<table><tr><th>실행</th><th>프로세스 전체</th><th>종료 코드</th></tr>'
        for row in m['runs']:body+=f'<tr><td>독립 프로세스 {row["run"]}</td><td>{row["process_seconds"]:.2f}초</td><td>{row["returncode"]}</td></tr>'
        body+='</table><video controls playsinline preload="metadata" src="h3-run-1/output.mp4"></video><p><a href="h3-run-1/output.mp4">영상 열기</a> · <a href="h3-metrics.json">실행 기록</a> · <a href="h3-run-1/verification.json">미디어 검사</a></p>'
        if h3root!=root:body=body.replace('src="h3-', 'src="h3-shift6/h3-').replace('href="h3-', 'href="h3-shift6/h3-')
        cards.append('<section><h2>MiniMax H3 영상</h2>'+body+'</section>')
    page='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AI 컴퓨터 · 로컬 실측</title><style>
    *{box-sizing:border-box}body{margin:0;background:#eff2f3;color:#16282e;font:16px/1.65 -apple-system,BlinkMacSystemFont,sans-serif}main{max-width:1200px;margin:auto;padding:56px 24px}h1{font-size:40px;letter-spacing:-1.5px;margin:8px 0}h2{font-size:23px}header{margin-bottom:30px}.eyebrow{color:#337461;letter-spacing:2px;font-size:12px;font-weight:700}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}section{background:white;border:1px solid #dee5e5;border-radius:20px;padding:26px;overflow:hidden}.muted,small{color:#62747b}table{width:100%;border-collapse:collapse;font-size:14px;margin:16px 0}td,th{padding:10px 4px;text-align:left;border-bottom:1px solid #e4e9e9}video,img{width:100%;max-height:480px;object-fit:contain;background:#102027;border-radius:10px}audio{width:100%}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:14px/1.8 -apple-system,sans-serif;max-height:500px;overflow:auto;background:#f5f7f7;padding:14px;border-radius:10px}a{color:#176b58}footer{margin-top:30px;color:#62747b}@media(max-width:760px){.grid{grid-template-columns:1fr}h1{font-size:30px}}</style><main><header><div class="eyebrow">AI COMPUTER / LOCAL VALIDATION</div><h1>내 Mac에서, 실제로 만든 결과</h1><p>2026.09.09 · Apple M5 Max · 통합 메모리 128GB</p><p class="muted">모델별 생성 속도와 결과물 확인용 스크린입니다. 한국어 감도·품질 승인 및 모델 간 우열 판정은 포함하지 않습니다.</p></header><div class="grid">'''+''.join(cards)+'''</div><footer>MLX 요청 시간은 모델 로딩 이후부터 결과 저장 완료까지입니다. H3는 독립 프로세스 시작부터 종료까지로 측정 범위가 다릅니다. 첫 스크린에는 다운로드가 병행되었습니다. 파일 캐시를 강제로 비우지 않았으며 통제된 최적 성능 수치가 아닙니다. 새 측정 결과는 페이지를 다시 생성한 뒤 반영됩니다.</footer></main></html>'''
    (root/'index.html').write_text(page)
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('directory',type=Path);a=p.parse_args();render(a.directory.resolve())
