import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

// Keep the SPA and Django same-origin in development so auth does not require
// widening backend CORS. Override the target with VITE_API_PROXY_TARGET.
const apiProxy = {
  '/api': {
    target: process.env.VITE_API_PROXY_TARGET ?? 'http://127.0.0.1:8000',
    changeOrigin: true,
  },
};

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: apiProxy,
    },
    preview: {
      proxy: apiProxy,
    },
  };
});
