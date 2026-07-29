import os
import threading
import urllib.request
import http.server
import socketserver
import sys


class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


class SilentHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass


def main():
    os.chdir(os.getcwd())

    with ReusableTCPServer(("127.0.0.1", 0), SilentHandler) as server:
        port = server.server_address[1]
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()

        pages = [
            "index.html",
            "menu.html",
            "ordina.html",
            "ordina-rapido.html",
            "contatti.html",
            "offline.html",
        ]

        ok = True
        for page in pages:
            url = f"http://127.0.0.1:{port}/{page}"
            try:
                with urllib.request.urlopen(url, timeout=5) as response:
                    data = response.read()
                    print(f"[OK] {page} {response.status} {len(data)}")
            except Exception as exc:
                ok = False
                print(f"[ERR] {page} {type(exc).__name__}: {exc}")

        server.shutdown()
        server.server_close()

    print(f"OVERALL_OK={ok}")

    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
