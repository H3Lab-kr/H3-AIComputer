#!/usr/bin/env python3
"""Small local-only MLX model screen. Run each modality in its own prepared environment."""
import argparse, json, os, time, platform, importlib.metadata, resource
from pathlib import Path

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('kind',choices=['tts','image','llm']);p.add_argument('--model',type=Path,required=True);p.add_argument('--output',type=Path,required=True)
    p.add_argument('--repeats',type=int,default=3)
    a=p.parse_args()
    if not a.model.is_dir() or a.output.exists() or not 1<=a.repeats<=10:p.error('Existing model, new output directory, repeats 1..10 required')
    a.output.mkdir(parents=True);os.environ.update(HF_HUB_OFFLINE='1',TRANSFORMERS_OFFLINE='1',HF_HUB_DISABLE_TELEMETRY='1')
    report={'kind':a.kind,'model':str(a.model.resolve()),'created':time.strftime('%Y-%m-%dT%H:%M:%S%z'),'platform':platform.platform(),'status':'running','quality_approved':False,'runs':[], 'packages':{d.metadata['Name']:d.version for d in importlib.metadata.distributions()},'scope':'Single prompt; first request and same-process repeated requests. No cross-request KV cache requested. Not a quality or comparative benchmark.'}
    def save(): (a.output/'metrics.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    save();start=time.perf_counter()
    try:
        import mlx.core as mx
        if a.kind=='tts':
            from mlx_audio.tts.utils import load_model
            import numpy as np, soundfile as sf
            model=load_model(str(a.model.resolve()))
            prompt='중요한 결정 앞에서, 당신의 가능성을 함께 찾겠습니다. AI 컴퓨터가 오늘의 업무를 도와드립니다.'
            settings={'voice':'Sohee','lang_code':'Korean','temperature':0.7,'max_tokens':512}
        elif a.kind=='image':
            from mflux.models.flux2.variants import Flux2Klein
            from mflux.models.common.config import ModelConfig
            model=Flux2Klein(model_path=str(a.model.resolve()),model_config=ModelConfig.flux2_klein_4b(),quantize=8)
            prompt='Premium product photograph of a compact silver desktop computer on a warm oak desk in a modern Korean home office. One ceramic coffee cup, a green plant, soft morning window light, physically realistic metal texture, elegant composition, no lettering or logos.'
            settings={'width':1024,'height':1024,'num_inference_steps':4,'guidance':1.0,'seed':260909}
        else:
            from mlx_vlm import load,generate
            model,processor=load(str(a.model.resolve()))
            prompt='직원 5명인 카페에서 로컬 AI 컴퓨터를 활용할 수 있는 업무를 3개 제안해주세요. 각 항목에 필요한 입력 자료와 사람이 확인할 점을 한 문장씩 적어주세요. 한국어로 간결하게 답하세요.'
            settings={'max_tokens':384,'temperature':0.0,'enable_thinking':False}
        mx.synchronize();report['load_seconds']=time.perf_counter()-start;report['prompt']=prompt;report['settings']=settings;save()
        for i in range(a.repeats):
            mx.random.seed(260909);mx.reset_peak_memory();t=time.perf_counter()
            row={'run':i+1,'phase':'first_request' if i==0 else 'resident_repeat'}
            if a.kind=='tts':
                chunks=[];sample_rate=None
                for item in model.generate(prompt,**settings):
                    mx.eval(item.audio);chunks.append(np.asarray(item.audio));sample_rate=item.sample_rate
                if not chunks:raise RuntimeError('No audio generated')
                audio=np.concatenate(chunks);sf.write(a.output/f'run-{i+1}.wav',audio,sample_rate)
                row.update(audio_seconds=len(audio)/sample_rate,sample_rate=sample_rate,artifact=f'run-{i+1}.wav')
            elif a.kind=='image':
                image=model.generate_image(prompt=prompt,**settings);image.save(str(a.output/f'run-{i+1}.png'))
                row['artifact']=f'run-{i+1}.png'
            else:
                formatted=processor.apply_chat_template([{'role':'user','content':prompt}],tokenize=False,add_generation_prompt=True,enable_thinking=False)
                result=generate(model,processor,formatted,max_tokens=384,temperature=0.0)
                (a.output/f'run-{i+1}.txt').write_text(result.text)
                row.update(generation_tokens=result.generation_tokens,generation_tokens_per_second=result.generation_tps,prompt_tokens=result.prompt_tokens,finish_reason=result.finish_reason,artifact=f'run-{i+1}.txt')
            mx.synchronize();row['request_seconds']=time.perf_counter()-t;row['mlx_peak_bytes']=mx.get_peak_memory()
            if a.kind=='tts':row['real_time_factor']=row['request_seconds']/row['audio_seconds']
            report['runs'].append(row);save();print(json.dumps(row),flush=True)
        report['status']='generated_unreviewed'
    except BaseException as e:
        report['status']='failed';report['error']=repr(e);raise
    finally:
        report['process_scope_seconds']=time.perf_counter()-start;report['process_peak_rss_bytes']=resource.getrusage(resource.RUSAGE_SELF).ru_maxrss;save()
if __name__=='__main__':main()
