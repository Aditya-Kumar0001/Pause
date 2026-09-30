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
