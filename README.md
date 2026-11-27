<p align="center"><img src="public/logo.svg" alt="Trunkful logo" width="480" /></p>

# Trunkful

**Every bag, every traveler, one checklist.**

![Visits](https://abacus.jasoncameron.dev/get/lance6x5.github.io/road-trip-packer/shield)

A **Silverlight DevTech** project · © 2026 Silverlight DevTech. Source-available under the [PolyForm Noncommercial License 1.0.0](LICENSE.md).

More apps: https://lance6x5.github.io/

Trunkful is a small, offline-capable web app for building road trip packing checklists for the whole family. Your trips are stored and processed entirely in your browser, and the app is hosted on GitHub Pages.

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
  feedback.js    pre-filled GitHub issue links for the footer Feedback menu
  visits.js      anonymous per-session visit counter (Abacus) shown in the footer
  views/         home and trip HTML renderers
  styles.css     theme variables, layout, print styles
tests/           vitest unit tests
public/          Trunkful logo and SVG app icons (favicon, 192, 512, maskable)
```

## Versioning

Trunkful follows [Semantic Versioning](https://semver.org/). The current version is in `package.json` and shown in the app footer (e.g. "v1.0.0").

- **MAJOR**: breaking change to the stored data or share-link schema (old exports/links may need migration).
- **MINOR**: new features that stay backward compatible.
- **PATCH**: bug fixes and small tweaks.

Changes are recorded in [CHANGELOG.md](CHANGELOG.md) (Keep a Changelog format). Each release is tagged `vX.Y.Z` and published as a GitHub release.

## Feedback & issues

Found a bug or have an idea? Use the **Feedback** button in the app footer, or go straight to GitHub:

- [Report a bug](https://github.com/lance6x5/road-trip-packer/issues/new?template=bug_report.yml)
- [Request a feature](https://github.com/lance6x5/road-trip-packer/issues/new?template=feature_request.yml)
- [All issues](https://github.com/lance6x5/road-trip-packer/issues)

The in-app links open a pre-filled GitHub issue form (app version and, for bugs, your browser) in a new tab. A free GitHub account is required. Nothing from your trips is included; please don't add personal data. See [CONTRIBUTING.md](CONTRIBUTING.md) for how issues are triaged.

## Privacy

Your trip data never leaves your device: trips are stored in your browser and are never sent to a server. Share links contain the list itself, so anyone with the link can see it. The only outside request the app makes is the anonymous visit count described below.

### Privacy & analytics

Trunkful counts one anonymous page load per browser session using the open-source [Abacus](https://github.com/JasonLovesDoggo/abacus) counter. The count is shown in the app footer and in the badge above.

- No cookies, no personal data stored, and nothing from your trips is sent.
- Do Not Track and Global Privacy Control are respected: if either is on, your visit is not counted (the total is only read).
- Like any web request, it reveals your IP address to the counter service.
- The count is approximate (it includes bots and is not unique visitors) and is public.

## License

Copyright © 2026 Silverlight DevTech. Trunkful is **source-available**, not OSI-approved open source. It is licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE.md) (SPDX: `PolyForm-Noncommercial-1.0.0`).

- **Free for noncommercial use:** personal, educational, research, nonprofit and other noncommercial use is allowed under the license terms.
- **Commercial use needs a separate license:** selling it, hosting it as a paid service, or using it inside a business product requires a commercial license from Silverlight DevTech. To ask, open a [GitHub issue](https://github.com/lance6x5/road-trip-packer/issues) on this repo.
- **Redistribution:** anyone redistributing the code must keep [LICENSE.md](LICENSE.md), including its `Required Notice` line.

Third-party dependencies keep their own licenses.

## Trademarks

Trunkful and its logo are trademarks of Silverlight DevTech. The license covers the code only, not the names or logos, so forks must use a different name and logo.
