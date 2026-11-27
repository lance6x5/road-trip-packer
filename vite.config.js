import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// base must match the GitHub repo name so assets resolve on GitHub Pages.
export default defineConfig({
  base: '/road-trip-packer/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icon.svg', 'maskable-icon.svg'],
      manifest: {
        name: 'Road Trip Packing List',
        short_name: 'Trip Packer',
        description: 'Packing checklists for road trips, per traveler, shareable by link.',
        start_url: '/road-trip-packer/',
        scope: '/road-trip-packer/',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#0f766e',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'maskable-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,webmanifest}'],
        navigateFallback: 'index.html'
      }
    })
  ],
  test: {
    include: ['tests/**/*.test.js']
  }
});
