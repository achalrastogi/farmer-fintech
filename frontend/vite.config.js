import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Farmer Fintech Education',
        short_name: 'FarmerFintech',
        description: 'Financial literacy for rural Indian farmers',
        theme_color: '#16a34a',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        // Cache first 5 story modules + game for offline use
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /\/api\/v1\/education\/story/,
            handler: 'NetworkFirst',
            options: { cacheName: 'stories-cache', expiration: { maxAgeSeconds: 86400 } }
          },
          {
            urlPattern: /\/api\/v1\/practice\/game\/start/,
            handler: 'NetworkFirst',
            options: { cacheName: 'game-cache', expiration: { maxAgeSeconds: 3600 } }
          }
        ]
      }
    })
  ]
})
