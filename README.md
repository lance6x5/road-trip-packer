# Road Trip Packing List

A small, offline-capable web app for building road trip packing checklists for the whole family. 100% client-side and hosted on GitHub Pages.

**Live:** https://lance6x5.github.io/road-trip-packer/

## Features

- **Templates:** Weekend road trip, Week-long road trip, Beach, Camping, Winter/ski, Theme park, Visiting family. Combine as many as you like; items merge without duplicates (the larger quantity wins).
- **Travelers:** add adults, kids, toddlers and babies. Each gets their own section with type-appropriate defaults (diapers for babies, car games for kids, and so on), plus a shared **Family / Car** section.
- **Checklist:** tap to check off; add, edit, delete and reorder items (↑/↓ within a category); quantity per item.
- **Auto-scaling quantities:** items like socks scale with trip length (e.g. socks = days + 1). You can set the per-day rule on any item.
- **Progress bars** per person and overall, plus a **Hide packed items** toggle.
- **Share by URL:** the whole list (travelers, items, checked states) is compressed with lz-string into the link hash. No backend. Very long links get a warning and a JSON export option instead.
- **Multiple named trips** saved locally in IndexedDB (localStorage fallback).
- **Export / Import JSON**, **Reset all data** (with confirmation), **printable view**.
- Installable **PWA** that works offline; light and dark mode; big tap targets; keyboard accessible.

## Local development

```bash
npm install
npm run dev      # start the dev server
npm test         # run unit tests (vitest, non-watch)
npm run build    # production build into dist/
npm run preview  # serve the production build
```

## Deploying to GitHub Pages

1. Push this repo to GitHub (branch `main`).
2. One-time setup: **Repo Settings → Pages → Source: "GitHub Actions"**.
3. Every push to `main` runs `.github/workflows/deploy.yml`, which installs, tests, builds and deploys `dist/`. You can also run it manually from the Actions tab (workflow_dispatch).

The Vite `base` is set to `/road-trip-packer/` in `vite.config.js`. If you rename the repo, update `base` and the manifest `start_url` / `scope` to match.

## Project structure

```
src/
  main.js        router (#/, #/trip/<id>, #/s/<share-data>), state, event handling
  model.js       pure trip logic: templates merge, travelers, items, progress, validation
  templates.js   trip templates and traveler-type defaults
  pack.js        compact share-link serialization
  share.js       lz-string compression for share URLs
  storage.js     IndexedDB persistence with localStorage fallback
  dialog.js      accessible <dialog> helpers
  util.js        escaping, downloads, clipboard, toast
  views/         home and trip HTML renderers
  styles.css     theme variables, layout, print styles
tests/           vitest unit tests
public/          SVG app icons
```

## Privacy

All data stays in your browser. Nothing is sent anywhere. Share links contain the list itself, so anyone with the link can see it.
