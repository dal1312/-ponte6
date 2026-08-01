const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const targets = [
  'index.html',
  'menu.html',
  'ordina.html',
  'ordina-rapido.html',
  'contatti.html',
  'offline.html',
  'privacy.html',
  'css/styles.css',
  'js/main.js',
  'js/site-config.js',
  'js/site.js',
  'js/order.js',
  'js/menu-data.js',
  'manifest.json',
  'service-worker.js',
  'favicon.ico',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/home/logo.png',
  'assets/home/sala.jpg',
  'assets/home/esterno.jpg',
  'assets/home/pasta-fresca.jpg',
  'assets/home/tartare.jpg',
  'assets/home/tortelli.jpg',
  'assets/home/pizza.jpg',
  'assets/home/bancone.jpg',
  'assets/home/sala.webp',
  'assets/home/esterno.webp',
  'assets/home/pasta-fresca.webp',
  'assets/home/tartare.webp',
  'assets/home/tortelli.webp',
  'assets/home/pizza.webp',
  'assets/home/bancone.webp'
];

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const filePath = path.resolve(root, relativePath);
    if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) throw new Error('Invalid path');

    const body = await fs.readFile(filePath);
    response.writeHead(200, { 'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
});

server.listen(0, '127.0.0.1', async () => {
  const { port } = server.address();
  let ok = true;

  try {
    for (const target of targets) {
      const response = await fetch(`http://127.0.0.1:${port}/${target}`);
      const body = await response.arrayBuffer();
      const passed = response.ok && body.byteLength > 0;
      ok = ok && passed;
      console.log(`[${passed ? 'OK' : 'ERR'}] ${target} ${response.status} ${body.byteLength}`);
    }
  } catch (error) {
    ok = false;
    console.error(`[ERR] ${error.message}`);
  } finally {
    server.close(() => {
      console.log(`OVERALL_OK=${ok}`);
      process.exitCode = ok ? 0 : 1;
    });
  }
});
