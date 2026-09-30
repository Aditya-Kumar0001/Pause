import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createKinkooApi } from './kinkooApi.js';

try {
  process.loadEnvFile?.('.env.local');
} catch {
  // Production should provide FIREBASE_PROJECT_ID and KINKOO_SQLITE_PATH as env vars.
}

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const buildRoot = resolve(root, 'dist');
const api = createKinkooApi({
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
  databasePath: process.env.KINKOO_SQLITE_PATH || resolve(root, 'data', 'kinkoo.sqlite')
});
const allowedApiOrigins = new Set(
  (process.env.KINKOO_ALLOWED_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean)
);

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2'
};

async function serveStatic(request, response) {
  const pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname);
  const candidate = resolve(buildRoot, `.${pathname}`);
  if (candidate !== buildRoot && !candidate.startsWith(`${buildRoot}${sep}`)) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  let filePath = candidate;
  try {
    const info = await stat(filePath);
    if (info.isDirectory()) filePath = resolve(filePath, 'index.html');
    await stat(filePath);
  } catch {
    filePath = resolve(buildRoot, 'index.html');
  }
  try {
    const contents = await readFile(filePath);
    response.writeHead(200, {
      'Content-Type': contentTypes[extname(filePath)] || 'application/octet-stream',
      'Cache-Control': extname(filePath) === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable'
    });
    response.end(contents);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Website build not found. Run npm run build before starting the production server.');
  }
}

const server = createServer(async (request, response) => {
  try {
    const origin = request.headers.origin;
    const isKinkooApiRequest = request.url?.startsWith('/api/kinkoo');
    const isAllowedApiOrigin = typeof origin === 'string' && allowedApiOrigins.has(origin);

    if (isKinkooApiRequest && isAllowedApiOrigin) {
      response.setHeader('Access-Control-Allow-Origin', origin);
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      response.setHeader('Vary', 'Origin');
    }

    if (isKinkooApiRequest && request.method === 'OPTIONS') {
      if (!isAllowedApiOrigin) {
        response.writeHead(403).end();
        return;
      }
      response.writeHead(204).end();
      return;
    }

    if (await api(request, response)) return;
    await serveStatic(request, response);
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ error: error.message || 'Server error.' }));
  }
});

const port = Number(process.env.PORT || 8787);
server.listen(port, process.env.HOST || '0.0.0.0', () => {
  console.log(`Pause app and SQLite API listening on port ${port}.`);
});
