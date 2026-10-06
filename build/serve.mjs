// Serveur statique minimal pour prévisualiser site-internet/ (node build/serve.mjs [port])
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'site-internet');
const PORT = Number(process.argv[2] || process.env.PORT || 8791);
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain', '.ico': 'image/x-icon' };
createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (path.endsWith('/')) path += 'index.html';
    let file = join(ROOT, path);
    try { if ((await stat(file)).isDirectory()) { res.writeHead(301, { Location: path + '/' }); return res.end(); } } catch {}
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  } catch {
    try { const data = await readFile(join(ROOT, '404', 'index.html')); res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(data); }
    catch { res.writeHead(404); res.end('404'); }
  }
}).listen(PORT, () => console.log(`CAPIBNB → http://localhost:${PORT}`));
