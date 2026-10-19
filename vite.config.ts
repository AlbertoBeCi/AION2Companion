import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

interface ProxyRequestHook {
  on(event: 'proxyReq', listener: (proxyRequest: { removeHeader: (header: string) => void }) => void): void;
}

export default defineConfig({
  server: {
    proxy: {
      '/fbapi': {
        target: 'https://www.aion2timers.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/fbapi/, ''),
        headers: {
          accept: 'application/json, */*',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        },
        configure(proxy) {
          (proxy as unknown as ProxyRequestHook).on('proxyReq', (proxyRequest) => {
            proxyRequest.removeHeader('origin');
            proxyRequest.removeHeader('referer');
          });
        },
      },
    },
  },
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'prompt',
    injectRegister: false,
    includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
    manifest: {
      name: 'AION 2 Companion', short_name: 'AION 2', description: 'Seguimiento manual y local para AION 2.',
      theme_color: '#2855F5', background_color: '#111111', lang: 'es', display: 'standalone', start_url: '/',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
      ]
    },
    workbox: { navigateFallback: '/', globPatterns: ['**/*.{js,css,html,svg,png,woff2,mp3}'], cleanupOutdatedCaches: true }
  })],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react-vendor';
          if (/node_modules\/motion\//.test(id)) return 'motion-vendor';
          if (/node_modules\/(dexie|dexie-react-hooks|zod|zustand|@tanstack)\//.test(id)) return 'data-vendor';
          if (/node_modules\/(i18next|react-i18next)\//.test(id)) return 'i18n-vendor';
        },
      },
    },
  },
});
