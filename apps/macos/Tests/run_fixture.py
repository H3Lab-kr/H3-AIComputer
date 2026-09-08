"""Network integration test, using a temporary loopback-only fake model server."""
import json
import os
import subprocess
import threading
import tempfile
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
class Handler(BaseHTTPRequestHandler):
    def log_message(self,*args): pass
    def reply(self, data):
        self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(json.dumps(data).encode())
    def do_GET(self):
        if self.path!='/v1/models':self.send_error(404);return
        self.reply({'data':[{'id':'fixture-model'}]})
    def do_POST(self):
        body=json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        if self.path == '/v1/chat/completions' and body.get('model') in ['agent-fixture', 'computer-fixture']:
            final=body['messages'][-1]['content'].startswith('H3 tool result')
            action={'action':'final' if final else 'write_text','path':'agent-result.md','content':'승인 필요','kind':'','prompt':'','message':'거절을 반영했습니다' if final else '새 문서를 만듭니다'}
            if body.get('model') == 'computer-fixture' and not final: action.update(action='computer_observe', path='', content='')
            self.reply({'choices':[{'message':{'content':json.dumps(action,ensure_ascii=False)}}]});return
        if self.path!='/v1/chat/completions' or body['messages'][-1]['content']!='테스트':self.send_error(400);return
        if body.get('stream'):
            self.send_response(200); self.send_header('Content-Type','text/event-stream'); self.end_headers()
            mode=body['model']
            try:
                for content in ['로컬 ', '스트리밍 ', '응답']:
                    raw=('data: '+json.dumps({'choices':[{'delta':{'content':content},'finish_reason':None}]},ensure_ascii=False)+'\n\n').encode()
                    # Split even inside Korean UTF-8 sequences to exercise network decoding.
                    for i in range(0,len(raw),7): self.wfile.write(raw[i:i+7]); self.wfile.flush()
                    time.sleep(0.02)
                if mode=='broken': return
                if mode=='malformed': self.wfile.write(b'data: invalid-json\n\n'); return
                self.wfile.write(b'data: [DONE]\n\n'); self.wfile.flush()
            except (BrokenPipeError, ConnectionResetError): pass
        else:
            self.reply({'choices':[{'message':{'content':'로컬 연결 테스트 응답'}}]})
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
env=dict(os.environ, AI_COMPUTER_TEST_ENDPOINT=f'http://127.0.0.1:{server.server_port}/v1')
try:
    root=Path(__file__).resolve().parents[1]
    with tempfile.TemporaryDirectory() as tmp:
        binary=str(Path(tmp)/'client-tests')
        subprocess.run(['swiftc','-parse-as-library',str(root/'Sources/AIComputer/Localization.swift'),str(root/'Sources/AIComputer/Client.swift'),str(root/'Tests/AIComputerTests/ClientTests.swift'),'-o',binary],check=True)
        result=subprocess.run([binary],env=env,check=True)
        agent_binary=str(Path(tmp)/'agent-tests')
        sources=['Localization.swift','MediaPlayer.swift','Client.swift','MediaJob.swift','MediaView.swift','Agent.swift','ComputerControl.swift','ModelLibrary.swift','CloudMedia.swift']
        subprocess.run(['swiftc','-parse-as-library',*[str(root/'Sources/AIComputer'/name) for name in sources],str(root/'Tests/AIComputerTests/AgentTests.swift'),'-o',agent_binary],check=True)
        result=subprocess.run([agent_binary],env=env)
finally:server.shutdown();server.server_close()
raise SystemExit(result.returncode)
