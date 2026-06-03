const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const DATA_FILE = path.join(__dirname, 'tournament_data.json');

http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // 1. Limpiar query strings y parámetros de la URL
    let urlPath = req.url.split('?')[0];
    
    // Check if it's the API path
    if (urlPath === '/api/data') {
        if (req.method === 'GET') {
            fs.access(DATA_FILE, fs.constants.F_OK, (err) => {
                if (err) {
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ empty: true }));
                } else {
                    fs.readFile(DATA_FILE, 'utf-8', (err, data) => {
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                            res.end(JSON.stringify({ empty: true, error: err.message }));
                        } else {
                            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                            res.end(data);
                        }
                    });
                }
            });
        } else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    
                    // Backup existing file
                    if (fs.existsSync(DATA_FILE)) {
                        fs.renameSync(DATA_FILE, DATA_FILE + '.bak');
                    }
                    
                    fs.writeFile(DATA_FILE, JSON.stringify(parsed, null, 4), 'utf-8', (err) => {
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                            res.end(JSON.stringify({ status: 'error', message: err.message }));
                        } else {
                            console.log("✓ Datos guardados localmente con éxito en tournament_data.json (Node.js)");
                            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                            res.end(JSON.stringify({ status: 'success' }));
                        }
                    });
                } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON: ' + e.message }));
                }
            });
        } else {
            res.writeHead(405, { 'Content-Type': 'text/plain' });
            res.end('Method Not Allowed');
        }
        return;
    }

    // 2. Decodificar espacios y caracteres especiales de la URL (por ejemplo %20)
    let decodedPath = decodeURIComponent(urlPath);
    
    // 3. Obtener ruta absoluta del archivo en el sistema
    let filePath = path.join(__dirname, decodedPath);
    
    // 4. Verificar si es un directorio y buscar index.html por defecto
    fs.stat(filePath, (err, stats) => {
        if (!err && stats.isDirectory()) {
            filePath = path.join(filePath, 'index.html');
        }
        
        // 5. Mapear extensiones a tipos MIME
        const extname = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html; charset=utf-8',
            '.js': 'text/javascript; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.json': 'application/json; charset=utf-8',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.csv': 'text/csv; charset=utf-8'
        };
        
        const contentType = mimeTypes[extname] || 'application/octet-stream';
        
        // 6. Leer y responder con el archivo correspondiente
        fs.readFile(filePath, (error, content) => {
            if (error) {
                if (error.code === 'ENOENT') {
                    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end('<h1>404 - Archivo no encontrado</h1><p>El recurso que buscas no existe en el sistema local.</p>', 'utf-8');
                } else {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end(`Error del Servidor: ${error.code}`);
                }
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    });
}).listen(PORT, () => {
    console.log(`\n===================================================`);
    console.log(` Servidor local corriendo en http://localhost:${PORT}`);
    console.log(` Servidor listo para peticiones y persistencia local.`);
    console.log(`===================================================\n`);
});
