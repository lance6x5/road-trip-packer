# Changelog

All notable changes to Trunkful are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.0] - 2026-11-27

### Added

- LICENSE.md with the PolyForm Noncommercial License 1.0.0 and its `Required Notice` line.
- Studio credit in the footer ("A Silverlight DevTech project · © 2026 Silverlight DevTech") with the studio mark, a link to the license and a "More apps" link to the apps homepage (https://lance6x5.github.io/).
- Trademark note, License section and author/copyright meta tags; a "Licensing of contributions" note in CONTRIBUTING.md.

### Changed

- Trunkful is now licensed under the PolyForm Noncommercial License 1.0.0 (source-available; previous versions had no license). Commercial use requires a separate license from Silverlight DevTech.

## [1.2.0] - 2026-11-27

### Added

- Anonymous visit counter in the footer (e.g. "12,345 visits") using the open-source Abacus counter: one count per browser session, no cookies or personal data, skipped when Do Not Track or Global Privacy Control is on, hidden if the counter can't be reached.
- Visits badge and a "Privacy & analytics" section in the README.

### Changed

- Footer and README privacy wording now say trip data stays in your browser and the only outside request is the anonymous visit count.
- The service worker never caches the visit counter request (Workbox `NetworkOnly` rule).

## [1.1.0] - 2026-11-27

### Added

- In-app feedback: a **Feedback** menu in the footer with "Report a bug" and "Request a feature", opening a pre-filled GitHub issue (app version and browser only, no trip data) in a new tab.
- GitHub issue forms for bug reports and feature requests (auto-labelled `triage`), plus a CONTRIBUTING.md describing the triage flow.

### Changed

- README logo wordmark now adapts to dark mode so it stays readable.

## [1.0.0] - 2026-11-27

### Added

- Trip templates (Weekend road trip, Week-long road trip, Beach, Camping, Winter/ski, Theme park, Visiting family) with default items across Clothing, Toiletries, Electronics, Car kit, Snacks, Documents, Meds and Entertainment; templates can be combined and merge without duplicates.
- Travelers (adult, kid, toddler, baby), each with their own section and type-appropriate defaults, plus a shared Family / Car section.
- Checklist with tap-to-check, add, edit, delete and reorder, per-item quantities, and optional auto-scaling by trip length (e.g. socks = days + 1).
- Progress bars per traveler and overall, and a "Hide packed items" toggle.
- Share links that store the full list in the URL hash (lz-string compressed), with a warning and JSON export fallback for very long links.
- Multiple named trips saved locally (IndexedDB with localStorage fallback), JSON export/import, and "Reset all data" with confirmation.
- Printable view, light and dark themes, installable offline PWA.
- Trunkful branding: logo, brand palette, favicon and PWA icons, app version shown in the footer.

### Changed

- Nothing yet (first release).

### Fixed

- Nothing yet (first release).

[Unreleased]: https://github.com/lance6x5/road-trip-packer/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/lance6x5/road-trip-packer/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/lance6x5/road-trip-packer/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/lance6x5/road-trip-packer/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/lance6x5/road-trip-packer/releases/tag/v1.0.0
