import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// base must match the GitHub repo name so assets resolve on GitHub Pages.
export default defineConfig({
  base: '/road-trip-packer/',
  // Exposes the package.json version to the UI (footer).
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icon.svg', 'logo.svg', 'icon-192.svg', 'icon-512.svg', 'maskable-icon.svg'],
      manifest: {
        name: 'Trunkful: Road Trip Packing List',
        short_name: 'Trunkful',
        description: 'Trunkful: every bag, every traveler, one checklist. Road trip packing lists shareable by link.',
        start_url: '/road-trip-packer/',
        scope: '/road-trip-packer/',
        display: 'standalone',
        background_color: '#fdf8f4',
        theme_color: '#1e1b4b',
        icons: [
          { src: 'icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'maskable-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,webmanifest}'],
        navigateFallback: 'index.html',
        // Never cache or serve the anonymous visit counter from the service worker.
        runtimeCaching: [
          { urlPattern: /^https:\/\/abacus\.jasoncameron\.dev\//, handler: 'NetworkOnly' }
        ]
      }
    })
  ],
  test: {
    include: ['tests/**/*.test.js']
  }
});
