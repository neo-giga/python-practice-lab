// Serve dist/ under a repository-style subpath, the way GitHub Pages does:
//   http://127.0.0.1:4173/python-practice-lab/
// Usage: node scripts/serve-dist.mjs [--port 4173] [--base /python-practice-lab/]
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const port = Number(opt('--port', process.env.PORT ?? 4173));
const base = opt('--base', '/python-practice-lab/');
const root = resolve('dist');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.zip': 'application/zip',
  '.map': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

if (!existsSync(join(root, 'index.html'))) {
  console.error('dist/index.html not found: run `npm run build` first');
  process.exit(1);
}

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (url.pathname === base.slice(0, -1)) {
    res.writeHead(301, { location: base });
    return res.end();
  }
  if (!url.pathname.startsWith(base)) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    return res.end(`Not found. The app is served at ${base}`);
  }
  let rel = decodeURIComponent(url.pathname.slice(base.length)) || 'index.html';
  const file = normalize(join(root, rel));
  if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    return res.end('Not found');
  }
  res.writeHead(200, {
    'content-type': types[extname(file)] ?? 'application/octet-stream',
    'cache-control': file.includes(`${join(root, 'assets')}`) || file.includes(join(root, 'pyodide')) ? 'public, max-age=3600' : 'no-cache',
  });
  createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`Serving dist/ at http://127.0.0.1:${port}${base}`));
