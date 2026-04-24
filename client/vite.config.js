import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg', 'xpense-logo.png'],
      manifest: {
        name: 'Xpense - Expense Tracker',
        short_name: 'Xpense',
        description: 'Track expenses, manage income, and gain financial insights with a beautiful mobile-first experience.',
        theme_color: '#FAFAFA',
        background_color: '#FAFAFA',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  server: {
    port: 8000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ['react-is'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3') || id.includes('node_modules/victory')) {
            return 'vendor-charts';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom') || id.includes('node_modules/scheduler')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/')) {
            return 'vendor-misc';
          }
        },
      },
    },
  },
});
