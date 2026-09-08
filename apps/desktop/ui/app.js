const $=s=>document.querySelector(s),el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
let state={},page='home',working=false,models=[],agentResult='',reply='',events=[],mediaResult=null;
const api=window.h3;
const pages={home:'워크스페이스',agent:'AI 에이전트',chat:'대화',media:'음성 · 이미지 · 영상',models:'모델 라이브러리',history:'작업 보관함',settings:'연결 설정'};
function message(text){$('#status').textContent=text;}
async function attempt(fn){try{return await fn();}catch(e){message(e.message);return undefined;}}
const save=()=>api.save(state);
function button(text,fn,primary=false){const b=el('button',text,primary?'primary':'');b.disabled=working;b.onclick=()=>attempt(fn);return b;}
function input(label,value,onchange,type='text'){const box=el('div');box.append(el('label',label));const i=el(type==='textarea'?'textarea':'input');if(type!=='textarea')i.type=type;i.value=value||'';i.disabled=working;i.oninput=()=>onchange(i.value);box.append(i);return box;}
function select(label,value,options,change){const box=el('div');box.append(el('label',label));const s=el('select');for(const[v,t]of options){const o=el('option',t);o.value=v;s.append(o);}s.value=value;s.disabled=working;s.onchange=()=>change(s.value);box.append(s);return box;}
function row(...items){const r=el('div',undefined,'row');r.append(...items);return r;}
function card(title,...items){const c=el('section',undefined,'card');if(title)c.append(el('h2',title));c.append(...items);return c;}
function goto(name){page=name;render();}
function providerControls(target=state){return select('실행 위치',target.provider,[['local','내 컴퓨터 · 기본'],['cloud','온라인 API · 선택']],v=>{target.provider=v;save();render();});}
function config(){return {...state,endpoint:state.endpoint||'http://127.0.0.1:11434/v1',cloudEndpoint:state.cloudEndpoint||'https://openrouter.ai/api/v1'};}
async function loadModels(c=config()){state.catalogKind=c.catalogKind||'chat';models=await api.models(c)||[];message(`${models.length}개 모델 확인`);render();}
function modelPicker(local){const key=local?'model':'cloudModel';return input('모델 ID',state[key],v=>{state[key]=v;save();});}
async function execute(fn){working=true;render();try{return await fn();}finally{working=false;render();}}
function render(){
 $('#pageLabel').textContent=pages[page];const local=page==='agent'?(state.brain||'local')==='local':page==='media'?(state.media.location||'local-cli')!=='cloud':state.provider==='local';$('#location').textContent=local?'● 내 컴퓨터 · 로컬 우선':'● 온라인 API · 사용자 선택';
 $('#nav').replaceChildren(...Object.entries(pages).map(([k,v])=>{const b=button(v,()=>goto(k));b.disabled=false;if(page===k)b.className='active';return b;}));
 const content=$('#content');content.replaceChildren();const append=(...x)=>content.append(...x);
 if(page==='home'){
  append(el('div','YOUR AI. YOUR COMPUTER.','eyebrow'),el('h1','내 컴퓨터에서 생각하고,\n만들고, 일을 맡기세요.'),el('p','설치된 AI가 기본입니다. 필요할 때만 온라인 모델을 선택하세요.'));
  append(card('시작 준비',el('p',`${({darwin:'macOS',win32:'Windows',linux:'Linux'})[state.platform]||state.platform} · ${state.memoryGB} GB 메모리 · H3 Preview ${state.version}`),row(button('1. 모델 연결',()=>goto('settings'),true),button('2. 설치 모델 선택',()=>goto('models')),button('3. 첫 작업 시작',()=>goto('agent')))));
  const grid=el('div',undefined,'grid');for(const[k,title,desc]of [['agent','AI에게 작업 맡기기','자료 읽기, 새 문서 작성, 미디어 작업 준비를 한 번의 요청으로.'],['chat','함께 생각하는 대화','로컬 모델과 대화를 나누고 응답을 실시간으로 확인하세요.'],['media','아이디어를 콘텐츠로','내레이션, 이미지, 영상. 설치 도구 또는 선택형 API로.'],['models','나에게 맞는 모델','설치 모델 선택, 최신 태그 다운로드, 온라인 모델의 기능 확인.']])grid.append(card(title,el('p',desc),button('시작하기 ↗',()=>goto(k))));append(grid);
 }else if(page==='settings'){
  append(el('h1','내 AI를 연결하세요'),providerControls(),card('로컬 연결',input('로컬 API 주소',state.endpoint,v=>{state.endpoint=v;save();}),row(button('Ollama',()=>{state.endpoint='http://127.0.0.1:11434/v1';save();render();}),button('LM Studio',()=>{state.endpoint='http://127.0.0.1:1234/v1';save();render();}),button('로컬 모델 찾기',()=>loadModels({...config(),provider:'local'}))),el('p','인터넷 없이 사용하려면 모델을 미리 설치하고 서버를 로컬 전용으로 설정하세요. H3는 클라우드로 자동 전환하지 않습니다.','muted')));
  let secret='';append(card('선택형 클라우드 API',row(button('OpenRouter',()=>{state.cloudEndpoint='https://openrouter.ai/api/v1';save();render();}),button('OpenAI 호환',()=>{state.cloudEndpoint='https://api.openai.com/v1';save();render();})),input('HTTPS API 기본 주소',state.cloudEndpoint,v=>{state.cloudEndpoint=v;save();}),input('API 키', '',v=>secret=v,'password'),row(button('키 저장',async()=>{message(await api.key({endpoint:state.cloudEndpoint,key:secret}));secret='';render();}),button('저장 키 삭제',async()=>message(await api.key({endpoint:state.cloudEndpoint,key:''})))),el('p',state.secureKeys?'API 키는 운영체제 보안 저장소로 암호화합니다.':'OS 암호화 저장소가 없으면 키를 디스크에 저장하지 않고 현재 실행 메모리에만 보관합니다.','muted')));
  append(card('설치 안내',row(button('Ollama 설치 ↗',()=>api.external('https://ollama.com/download')),button('OpenRouter 모델 ↗',()=>api.external('https://openrouter.ai/models')))));
 }else if(page==='models'){
  append(el('h1','모델 라이브러리'),providerControls(),row(button('모델 목록 새로고침',()=>loadModels(),true),button('최신 로컬 모델 탐색 ↗',()=>api.external('https://ollama.com/search'))));
  let tag=state.pullTag||'';append(card('Ollama 다운로드 · 업데이트',input('공식 모델 이름:태그',tag,v=>{tag=v;state.pullTag=v;}),button('다운로드 / 태그 업데이트',()=>execute(async()=>message(await api.pull({endpoint:state.endpoint,name:tag})))),el('p','모델 파일 크기보다 실행 메모리가 더 필요합니다. 같은 태그의 업데이트는 이전 가중치를 바꿀 수 있습니다.','muted')));
  if(state.provider==='cloud')append(row(button('대화 모델',()=>loadModels()),button('이미지 모델',()=>loadModels({...config(),catalogKind:'image'})),button('영상 모델',()=>loadModels({...config(),catalogKind:'video'})),button('음성 모델',()=>loadModels({...config(),catalogKind:'speech'}))));
  let search=el('input');search.placeholder='모델 이름 검색';const list=el('div');function populate(){list.replaceChildren(...models.filter(m=>(m.id+' '+(m.name||'')).toLowerCase().includes(search.value.toLowerCase())).slice(0,100).map(m=>card(m.name||m.id,el('div',m.id,'tag'),el('p',[m.size?`파일 ${(m.size/2**30).toFixed(1)} GB`:'',m.details?.quantization_level||'',m.digest?`버전 ${m.digest.slice(0,12)}`:'',m.context?`컨텍스트 ${m.context.toLocaleString()}`:'',m.capabilities?JSON.stringify(m.capabilities):'',m.sizes?'크기 '+m.sizes.join(', '):''].filter(Boolean).join(' · '),'muted'),m.pricing?el('pre',JSON.stringify(m.pricing,null,2)):el('span',''),button('이 모델 선택',()=>{if(state.provider==='local')state.model=m.id;else state.cloudModel=m.id;save();message(m.id+' 선택됨');if(['image','speech','video'].includes(state.catalogKind)){state.media.kind=state.catalogKind;state.media.location='cloud';goto('media');}else goto('chat');}))));}search.oninput=populate;populate();append(search,list);
 }else if(page==='chat'){
  append(el('h1','함께 생각해볼까요?'),providerControls(),row(modelPicker(state.provider==='local'),button('모델 선택',()=>goto('models'))));
  for(const m of state.chat||[])append(card(m.role==='user'?'나':'H3',el('div',m.content,'reply')));
  if(reply)append(card('H3 · 응답',el('div',reply,'reply')));
  append(input('대화 입력',state.draft,v=>{state.draft=v;save();},'textarea'),row(button('보내기',()=>execute(async()=>{reply='';const result=await api.chat({...config(),prompt:state.draft});if(result){state=await api.state();reply='';}}),true),button('새 대화',async()=>{state.chat=[];state.draft='';reply='';await save();render();})));
 }else if(page==='agent'){
  append(el('h1','AI에게 작업을 맡기세요'),el('p','자료 → 계획 → 도구 실행 승인 → 결과. 로컬 AI가 기본 브레인입니다.'));
  const brain=state.brain||'local';append(select('브레인',brain,[['local','설치된 로컬 LLM · 기본'],['api','온라인 API / OpenRouter'],['codex','Codex CLI · 온라인'],['claude','Claude CLI · 온라인']],v=>{state.brain=v;render();}),modelPicker(brain==='local'));
  if(['codex','claude'].includes(brain))append(row(input('설치된 CLI 바이너리',state.cli,v=>state.cli=v),button('실행 파일 선택',async()=>{state.cli=await api.choose('file');render();})),el('p','현재 CLI의 구조화 출력으로 H3 도구를 계획합니다. CLI 로그인은 사전 준비하며 내장 셸·플러그인 도구는 이 경로에서 활성화하지 않습니다.','muted'));
  append(row(input('작업 폴더',state.workspace,v=>{state.workspace=v;save();}),button('폴더 선택',async()=>{state.workspace=await api.choose('folder');save();render();})),input('맡길 일',state.agentPrompt||'',v=>{state.agentPrompt=v;},'textarea'),button('작업 시작',()=>execute(async()=>{agentResult='';events=[];agentResult=await api.agent({...config(),brain,workspace:state.workspace,cli:state.cli,prompt:state.agentPrompt})||'';}),true));
  if(agentResult)append(card('결과',el('div',agentResult,'reply')));append(card('작업 과정',el('pre',events.join('\n'))));
 }else if(page==='media'){
  const m=state.media;append(el('h1','아이디어를 콘텐츠로'),select('생성 종류',m.kind,[['speech','음성'],['image','이미지'],['video','영상']],v=>{m.kind=v;m.steps=v==='video'?8:4;save();render();}),select('실행 위치',m.location||'local-cli',[['local-cli','설치된 CLI · 기본'],['local-api','설치형 로컬 API'],['cloud','선택형 온라인 API / OpenRouter']],v=>{m.location=v;save();render();}));
  if((m.location||'local-cli')==='local-cli')append(card('설치된 생성 도구',row(input('실행 파일',m.executable,v=>m.executable=v),button('도구 선택',async()=>{m.executable=await api.choose('file');save();render();})),row(input('로컬 모델 폴더',m.model,v=>m.model=v),button('모델 폴더',async()=>{m.model=await api.choose('folder');save();render();})),el('p','어댑터: MLX-Audio / MFLUX / h3.c. MLX 및 Metal 엔진은 Apple Silicon용입니다. Windows·Linux에서는 호환 로컬 API 서버나 해당 OS용 CLI가 필요합니다.','muted')));
  else append(card('API 연결',input('API 기본 주소',m.location==='cloud'?state.cloudEndpoint:state.endpoint,v=>{if(m.location==='cloud')state.cloudEndpoint=v;else state.endpoint=v;save();}),input('모델 ID',m.location==='cloud'?state.cloudModel:m.model,v=>{if(m.location==='cloud')state.cloudModel=v;else m.model=v;save();}),button('API 키 설정',()=>goto('settings'))));
  append(input('생성할 내용',m.prompt||'',v=>{m.prompt=v;save();},'textarea'),row(input('너비',m.width,v=>m.width=Number(v),'number'),input('높이',m.height,v=>m.height=Number(v),'number'),input('스텝 (CLI)',m.steps,v=>m.steps=Number(v),'number')),row(input('목소리 ID',m.voice,v=>m.voice=v),input('영상 초 (API)',m.seconds||4,v=>m.seconds=Number(v),'number')),button('설정 확인 후 생성',()=>execute(async()=>{await save();mediaResult=await api.media({...config(),...m,location:m.location||'local-cli'});}),true));
  if(mediaResult){const preview=el(mediaResult.kind==='image'?'img':mediaResult.kind==='speech'?'audio':'video');if(mediaResult.preview){preview.src=mediaResult.preview;preview.controls=true;}append(card('생성 완료 · 검토 전',preview,button('원본 / 로그 열기',()=>api.openJob(mediaResult.id))));}
 }else if(page==='history'){
  append(el('h1','작업 보관함'));attempt(async()=>{const records=await api.history();if(page!=='history')return;for(const r of records)append(card(r.kind+' · '+r.status,el('p',r.input?.prompt||''),el('small',r.started),button('원본과 기록 열기',()=>api.openJob(r.id))));});
 }
 if(working){const stop=button('현재 작업 중단',()=>api.stop());stop.disabled=false;append(stop);}
}
api.events(e=>{
 if(e.type==='text'){if(page==='agent')agentResult=e.text;else reply=e.text;render();}
 if(e.type==='progress'||e.type==='log'){message(e.text);if(page==='agent'){events.push(e.text);if(events.length>200)events.shift();}}
 if(e.type==='prepared'){state.media=e.media;message('로컬 미디어 초안을 준비했습니다. 생성 화면에서 설정을 확인하세요.');}
 if(e.type==='approval'){
  const a=e.request,c=card('실행 전 확인',el('p',a.message),el('pre',a.action==='write_text'?a.path+'\n\n'+a.content:a.kind+'\n'+a.prompt));c.classList.add('approval');const yes=button('승인',()=>{api.approve(true);c.remove();},true),no=button('거절',()=>{api.approve(false);c.remove();});yes.disabled=false;no.disabled=false;c.append(row(yes,no));$('#content').append(c);c.scrollIntoView({behavior:'smooth'});
 }
});
attempt(async()=>{state=await api.state();$('#version').textContent=`PREVIEW ${state.version} · ${state.platform}`;render();});
