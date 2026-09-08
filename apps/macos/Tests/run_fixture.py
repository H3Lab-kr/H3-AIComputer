"""Network integration test, using a temporary loopback-only fake model server."""
import json
import os
import subprocess
import threading
import tempfile
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
        if self.path!='/v1/chat/completions' or body['messages'][-1]['content']!='테스트':self.send_error(400);return
        self.reply({'choices':[{'message':{'content':'로컬 연결 테스트 응답'}}]})
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
env=dict(os.environ, AI_COMPUTER_TEST_ENDPOINT=f'http://127.0.0.1:{server.server_port}/v1')
try:
    root=Path(__file__).resolve().parents[1]
    with tempfile.TemporaryDirectory() as tmp:
        binary=str(Path(tmp)/'client-tests')
        subprocess.run(['swiftc','-parse-as-library',str(root/'Sources/AIComputer/Client.swift'),str(root/'Tests/AIComputerTests/ClientTests.swift'),'-o',binary],check=True)
        result=subprocess.run([binary],env=env)
finally:server.shutdown();server.server_close()
raise SystemExit(result.returncode)
