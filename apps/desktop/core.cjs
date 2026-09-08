const fs = require('node:fs/promises');
const path = require('node:path');
const {spawn} = require('node:child_process');
const crypto = require('node:crypto');
const ACTIONS = ['final','list_files','read_text','write_text','prepare_media'];
const SCHEMA = {type:'object', additionalProperties:false, properties:Object.fromEntries(['action','path','content','kind','prompt','message'].map(k=>[k,k==='action'?{type:'string',enum:ACTIONS}:{type:'string'}])),required:['action','path','content','kind','prompt','message']};
function endpoint(value, local) {
 const u=new URL(value);
 if(u.username||u.password||u.search||u.hash)throw Error('인증 정보나 쿼리가 없는 기본 API 주소를 사용하세요.');
 if(local ? u.protocol!=='http:'||!['127.0.0.1','[::1]'].includes(u.hostname) : u.protocol!=='https:')throw Error(local?'로컬 모드는 루프백 HTTP 주소만 사용합니다.':'온라인 API는 HTTPS 주소를 사용하세요.');
 return u.href.replace(/\/$/,'');
}
function modelTag(name) {if(typeof name!=='string'||!name||name.length>200||!/^\w[\w./:-]*$/.test(name)||name.includes('..')||name.includes('://')||/(?:-cloud|:cloud)$/.test(name))throw Error('정확한 로컬 모델 이름:태그를 입력하세요.');return name;}
function action(text) {
 const a=JSON.parse(text.trim().replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, ''));
 if(!ACTIONS.includes(a.action)||SCHEMA.required.some(k=>typeof a[k]!=='string'))throw Error('에이전트가 올바른 작업 형식을 반환하지 않았습니다.');return a;
}
async function scoped(root, name) {
 if(!name||path.isAbsolute(name)||name.includes('\\')||name.split('/').some(p=>!p||p.startsWith('.'))||!['.txt','.md','.csv','.json','.srt','.vtt'].includes(path.extname(name).toLowerCase()))throw Error('작업 폴더의 일반 텍스트 파일만 사용할 수 있습니다.');
 const r=await fs.realpath(root), target=path.resolve(r,name);
 if(!target.startsWith(r+path.sep))throw Error('폴더 범위를 벗어납니다.');
 let current=r;for(const part of name.split('/')){current=path.join(current,part);const info=await fs.lstat(current).catch(e=>{if(e.code==='ENOENT')return null;throw e;});if(info?.isSymbolicLink())throw Error('심볼릭 링크는 사용할 수 없습니다.');}
 return target;
}
async function readText(root,name){const f=await scoped(root,name),st=await fs.stat(f);if(!st.isFile()||st.size>65536)throw Error('64KB 이하 텍스트 파일을 선택하세요.');return fs.readFile(f,'utf8');}
async function writeText(root,name,content){if(Buffer.byteLength(content)>65536)throw Error('문서는 64KB까지 지원합니다.');const file=await scoped(root,name);await fs.writeFile(file,content,{flag:'wx',mode:0o600});return file;}
async function listFiles(root){return(await fs.readdir(root,{withFileTypes:true})).filter(f=>f.isFile()&&!f.name.startsWith('.')&&/\.(txt|md|csv|json|srt|vtt)$/i.test(f.name)).slice(0,100).map(f=>f.name).join('\n');}
async function atomic(file,value){await fs.mkdir(path.dirname(file),{recursive:true});const tmp=file+'.'+crypto.randomUUID()+'.tmp';await fs.writeFile(tmp,JSON.stringify(value,null,2),{mode:0o600});await fs.rename(tmp,file);}
function mediaArgs(c,output){
 if(!['speech','image','video'].includes(c.kind)||!c.prompt?.trim())throw Error('종류와 생성 내용을 입력하세요.');
 const width=Number(c.width),height=Number(c.height),steps=Number(c.steps),seed=Number(c.seed||1);
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<64||height<64||width>2048||height>2048||width%32||height%32||!Number.isInteger(steps)||steps<1||steps>100||!Number.isInteger(seed)||seed<0)throw Error('해상도는 64~2048의 32배수, 스텝 1~100, 시드는 0 이상 정수입니다.');
 if(c.kind==='speech')return ['--model',c.model,'--text',c.prompt,'--voice',c.voice||'Sohee','--lang_code','Korean','--output_path',output,'--join_audio'];
 if(c.kind==='image')return ['--model',c.model,'--base-model','flux2-klein-4b','--quantize','8','--prompt',c.prompt,'--steps',String(steps),'--seed',String(seed),'--width',String(width),'--height',String(height),'--output',path.join(output,'output.png')];
 return ['-d',c.model,'-p',c.prompt,'--layers','50','--reuse','1','--core-reuse','1','--use-reference-rope','--steps',String(steps),'--seed',String(seed),'--width',String(width),'--height',String(height),'--frames','107','-o',path.join(output,'output.mp4')];
}
async function runCLI(executable,args,cwd,{signal,onEvent,offline=true,stdin=''}={}){
 if(!path.isAbsolute(executable)||/\.(cmd|bat)$/i.test(executable))throw Error('설치된 실행 바이너리(.exe 포함)의 절대 경로를 선택하세요. 배치 스크립트는 지원하지 않습니다.');
 await fs.access(executable);
 const env={};for(const key of ['HOME','USERPROFILE','APPDATA','LOCALAPPDATA','SystemRoot','SYSTEMROOT','WINDIR','TEMP','TMP','TMPDIR','LANG'])if(process.env[key])env[key]=process.env[key];
 env.PATH=path.dirname(executable)+path.delimiter+(process.env.PATH||'');if(offline){env.HF_HUB_OFFLINE='1';env.TRANSFORMERS_OFFLINE='1';}env.HF_HUB_DISABLE_TELEMETRY='1';
 return new Promise((resolve,reject)=>{
  const child=spawn(executable,args,{cwd,env,shell:false,windowsHide:true,stdio:['pipe','pipe','pipe']});let out='',err='',timer;
  const stop=()=>{child.kill('SIGTERM');timer=setTimeout(()=>child.kill('SIGKILL'),3000);};
  if(signal?.aborted)stop();else signal?.addEventListener('abort',stop,{once:true});
  child.stdout.on('data',d=>{out=(out+d).slice(-2_000_000);onEvent?.({type:'log',text:String(d).slice(0,4000)});});
  child.stderr.on('data',d=>{err=(err+d).slice(-200_000);onEvent?.({type:'log',text:String(d).slice(0,4000)});});
  child.stdin.on('error',()=>{});child.stdin.end(stdin);
  child.on('error',reject);child.on('close',code=>{clearTimeout(timer);signal?.removeEventListener('abort',stop);if(signal?.aborted)reject(Error('작업을 중단했습니다.'));else if(code!==0)reject(Error(`CLI 종료 ${code}: ${err.slice(-1500)}`));else resolve({out,err});});
 });
}
module.exports={endpoint,modelTag,action,scoped,readText,writeText,listFiles,atomic,mediaArgs,runCLI,SCHEMA};
