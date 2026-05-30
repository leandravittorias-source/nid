import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'favicon.png', 'favicon-512.png', 'apple-touch-icon.png'],
        manifest: {
          name: 'Nós Dois - Aplicativo para Casais',
          short_name: 'Nós Dois',
          description: 'Gerenciar tarefas, finanças, memórias e rotina do casal em harmonia',
          theme_color: '#2b0b5a',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            { src: 'favicon.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'favicon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf}']
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 2000,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
