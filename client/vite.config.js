import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_DEV_API_TARGET || 'http://127.0.0.1:5000';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': path.resolve(import.meta.dirname, './src') },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': { target: apiTarget, changeOrigin: false },
        '/uploads': { target: apiTarget, changeOrigin: false },
        '/sitemap.xml': { target: apiTarget, changeOrigin: false },
        '/robots.txt': { target: apiTarget, changeOrigin: false },
      },
    },
    build: {
      target: 'es2022',
      sourcemap: false,
      // No manualChunks: forcing vendor chunks made the public entry preload admin-only
      // libraries (TipTap, dnd-kit). Lazy admin routes already split them out.
      chunkSizeWarningLimit: 900,
    },
  };
});
