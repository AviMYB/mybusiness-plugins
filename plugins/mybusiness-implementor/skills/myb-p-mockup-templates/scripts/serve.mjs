import http from 'node:http';
import path from 'node:path';
import { realpath, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export async function serve(folder, port = 4173) {
  const root = await realpath(folder);
  if (!(await stat(root)).isDirectory()) throw new Error('Preview root must be a directory');
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
  const server = http.createServer(async (req, res) => {
    const reply = (code, body) => { res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end(req.method === 'HEAD' ? undefined : body); };
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data:; connect-src 'none'; form-action 'none'; frame-ancestors 'none'; base-uri 'none'");
    if (!['GET', 'HEAD'].includes(req.method)) return reply(405, 'Read-only preview');
    if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host || '')) return reply(403, 'Local preview only');
    try {
      const raw = decodeURIComponent((req.url || '/').split('?')[0]);
      if (raw.includes('\\') || raw.includes('\0') || raw.split('/').some(p => p.startsWith('.'))) return reply(403, 'Not available');
      const requested = path.resolve(root, '.' + (raw === '/' ? '/index.html' : raw));
      const relative = path.relative(root, requested);
      if (relative.startsWith('..') || path.isAbsolute(relative)) return reply(403, 'Not available');
      const resolved = await realpath(requested);
      const realRelative = path.relative(root, resolved);
      if (realRelative.startsWith('..') || path.isAbsolute(realRelative)) return reply(403, 'Not available');
      const type = types[path.extname(resolved)];
      if (!type || !(await stat(resolved)).isFile()) return reply(404, 'Not found');
      const body = await readFile(resolved);
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': body.length });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch (error) { reply(error instanceof URIError ? 400 : 404, 'Not found'); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  console.log(`PREVIEW_URL=http://127.0.0.1:${server.address().port}`);
  console.log('STOP=Ctrl+C');
  console.log('STATUS=READY');
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const portAt = args.indexOf('--port');
  const port = portAt < 0 ? 4173 : Number(args[portAt + 1]);
  if (!args[0] || args[0].startsWith('--') || !Number.isInteger(port) || port < 0 || port > 65535) {
    console.error('Usage: node serve.mjs OUTPUT_DIR [--port 4173]'); process.exitCode = 1;
  } else {
    serve(args[0], port).catch(error => { console.error(`ERROR=${error.code || 'PREVIEW_FAILED'}`); console.error('STATUS=FAILED'); process.exitCode = 1; });
  }
}
