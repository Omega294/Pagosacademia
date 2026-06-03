import http.server
import socketserver
import json
import os
import sys

PORT = 8000
DATA_FILE = "academy_data.json"

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path == '/api/data':
            self.send_response(200)
            self.send_header('Content-type', 'application/json; charset=utf-8')
            self.end_headers()
            if os.path.exists(DATA_FILE):
                try:
                    with open(DATA_FILE, 'r', encoding='utf-8') as f:
                        content = f.read()
                        json.loads(content)
                        self.wfile.write(content.encode('utf-8'))
                except Exception as e:
                    print(f"Error leyendo archivo de datos: {e}")
                    self.wfile.write(json.dumps({"empty": True, "error": str(e)}).encode('utf-8'))
            else:
                self.wfile.write(json.dumps({"empty": True}).encode('utf-8'))
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/data':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                if os.path.exists(DATA_FILE):
                    backup_file = DATA_FILE + ".bak"
                    try:
                        if os.path.exists(backup_file):
                            os.remove(backup_file)
                        os.rename(DATA_FILE, backup_file)
                    except Exception as backup_err:
                        print(f"Advertencia al respaldar datos: {backup_err}")
                
                with open(DATA_FILE, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=4)
                
                print("✓ Datos guardados localmente con éxito en academy_data.json")
                self.send_response(200)
                self.send_header('Content-type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success"}).encode('utf-8'))
            except Exception as e:
                print(f"Error guardando datos: {e}")
                self.send_response(500)
                self.send_header('Content-type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

def run():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    print(f"Servidor iniciado en el directorio: {script_dir}")
    
    port = PORT
    while port < PORT + 10:
        try:
            socketserver.TCPServer.allow_reuse_address = True
            with socketserver.TCPServer(("", port), CustomHandler) as httpd:
                print(f"\n========================================================")
                print(f"  SERVIDOR LOCAL ACADEMIA ACTIVO")
                print(f"  Dirección local: http://localhost:{port}")
                print(f"  Presiona Ctrl+C en esta ventana para cerrar el servidor")
                print(f"========================================================\n")
                httpd.serve_forever()
        except OSError as e:
            if e.errno == 98 or e.errno == 10048:
                print(f"Puerto {port} ocupado, intentando puerto {port + 1}...")
                port += 1
            else:
                raise e
        except KeyboardInterrupt:
            print("\nServidor detenido por el usuario.")
            break
        except Exception as e:
            print(f"Error inesperado: {e}")
            break

if __name__ == '__main__':
    run()
