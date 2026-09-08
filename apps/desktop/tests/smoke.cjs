const {_electron:electron}=require('playwright');
const http=require('node:http'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'h3-smoke-'));
 const server=http.createServer(async(req,res)=>{
  let data='';for await(const d of req)data+=d;
  res.setHeader('Content-Type','application/json');
  if(req.url==='/v1/models')return res.end(JSON.stringify({data:[{id:'fixture'}]}));
  const body=JSON.parse(data),last=body.messages.at(-1).content,done=last.startsWith('H3 tool result');
  const action={action:done?'final':'write_text',path:'unapproved.md',content:'Do not write before approval',kind:'',prompt:'',message:done?'거절 확인':'새 문서 쓰기'};
  res.end(JSON.stringify({choices:[{message:{content:JSON.stringify(action)}}]}));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let app;
 try{
  app=await electron.launch({executablePath:require('electron'),args:[path.resolve(__dirname,'..'),`--user-data-dir=${path.join(tmp,'profile')}`]});
  const page=await app.firstWindow();await page.getByRole('heading',{name:/내 컴퓨터에서/}).waitFor();
  const state=await page.evaluate(()=>window.h3.state());assert.equal(state.provider,'local');
  assert.equal(await page.evaluate(()=>typeof window.require),'undefined');
  await page.getByRole('button',{name:'AI 에이전트',exact:true}).click();await page.getByRole('heading',{name:'AI에게 작업을 맡기세요'}).waitFor();
  const endpoint=`http://127.0.0.1:${server.address().port}/v1`;
  await page.evaluate(({workspace,endpoint})=>{window.agentPromise=window.h3.agent({brain:'local',provider:'local',model:'fixture',endpoint,workspace,prompt:'문서 작성'});},{workspace:tmp,endpoint});
  await page.getByRole('heading',{name:'실행 전 확인'}).waitFor();await assert.rejects(fs.access(path.join(tmp,'unapproved.md')));
  await page.getByRole('button',{name:'거절',exact:true}).click();
  const answer=await page.evaluate(()=>window.agentPromise);assert.equal(answer,'거절 확인');await assert.rejects(fs.access(path.join(tmp,'unapproved.md')));
  await page.getByRole('button',{name:'연결 설정',exact:true}).click();await page.getByRole('heading',{name:'내 AI를 연결하세요'}).waitFor();
  console.log('PASS native Electron launch, isolated renderer, local agent roundtrip and approval denial');
 }finally{await app?.close();server.close();await fs.rm(tmp,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exit(1)});
