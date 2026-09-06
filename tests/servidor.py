"""Servidor estatico dos testes.

Serve o site com os mesmos cabecalhos da producao (COOP/COEP), porque sem
eles um teste local nao reproduz as restricoes reais de origem cruzada --
que sao justamente onde este projeto ja tropecou duas vezes (o worker do
ffmpeg e as threads do onnxruntime).

Extra: POST /relato grava o corpo em um arquivo. As paginas de teste
reportam por ali em vez de dependerem do momento em que o --dump-dom do
navegador acontece; sem isso, um teste assincrono (transcricao) e cortado
no meio.

    python tests/servidor.py [porta] [raiz] [arquivo-de-relato]
"""
import http.server
import os
import sys
import threading

PORTA = int(sys.argv[1]) if len(sys.argv) > 1 else 8731
RAIZ = sys.argv[2] if len(sys.argv) > 2 else "."
RELATO = sys.argv[3] if len(sys.argv) > 3 else "relato.txt"

TRAVA = threading.Lock()


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=RAIZ, **kwargs)

    def end_headers(self):
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        # sem cache: um teste nunca deve passar por causa de arquivo velho
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_POST(self):
        tamanho = int(self.headers.get("Content-Length") or 0)
        corpo = self.rfile.read(tamanho).decode("utf-8", "replace")
        with TRAVA:
            with open(RELATO, "a", encoding="utf-8") as f:
                f.write(corpo + "\n")
                f.flush()
                os.fsync(f.fileno())
        self.send_response(204)
        self.end_headers()

    def log_message(self, *args):
        pass


# ThreadingHTTPServer, e nao TCPServer: com uma thread so, um POST fica
# preso atras de qualquer conexao que o navegador deixou aberta, e o teste
# inteiro *parece* travar do lado da pagina. Levou um bom tempo para achar.
http.server.ThreadingHTTPServer.allow_reuse_address = True

with http.server.ThreadingHTTPServer(("127.0.0.1", PORTA), Handler) as httpd:
    print("servindo %s em http://127.0.0.1:%d" % (RAIZ, PORTA), flush=True)
    httpd.serve_forever()
