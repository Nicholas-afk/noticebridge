"""Local QA only: add an axe-core panel when visiting /?qa=1. Never publish it."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, parse_qs

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIST), **kwargs)

    def do_GET(self):
        parsed = urlsplit(self.path)
        if parsed.path == '/__qa/axe.min.js':
            data = (ROOT / 'node_modules/axe-core/axe.min.js').read_bytes()
            self.send_response(200)
            self.send_header('Content-Type', 'application/javascript')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        elif parsed.path == '/__qa/audit.js':
            data = (ROOT / 'scripts/browser-audit.js').read_bytes()
            self.send_response(200)
            self.send_header('Content-Type', 'application/javascript')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        elif parsed.path in {'/', '/index.html'} and parse_qs(parsed.query).get('qa') == ['1']:
            html = (DIST / 'index.html').read_text().replace('</body>', '<script src="/__qa/axe.min.js"></script><script src="/__qa/audit.js"></script></body>')
            data = html.encode()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        else:
            super().do_GET()

print('Local QA: http://127.0.0.1:48138/?qa=1', flush=True)
ThreadingHTTPServer(('127.0.0.1', 48138), Handler).serve_forever()
