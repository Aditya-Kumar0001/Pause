import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { createKinkooApi } from './server/kinkooApi.js';

const localKinkooApi = (api: ReturnType<typeof createKinkooApi>): Plugin => ({
  name: 'pause-local-kinkoo-api',
  configureServer(server) {
    server.middlewares.use((request, response, next) => {
      if (request.url?.startsWith('/api/kinkoo')) {
        void api(request, response).catch((error: unknown) => {
          response.writeHead(500, { 'Content-Type': 'application/json' });
          response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Kinkoo API error.' }));
        });
      } else next();
    });
  },
  configurePreviewServer(server) {
    server.middlewares.use((request, response, next) => {
      if (request.url?.startsWith('/api/kinkoo')) {
        void api(request, response).catch((error: unknown) => {
          response.writeHead(500, { 'Content-Type': 'application/json' });
          response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Kinkoo API error.' }));
        });
      } else next();
    });
  }
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const api = createKinkooApi({ projectId: env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID });
  return {
    plugins: [react(), localKinkooApi(api)],
    server: { port: 5173, host: true }
  };
});
