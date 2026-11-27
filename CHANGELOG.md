# Changelog

All notable changes to Trunkful are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/lance6x5/road-trip-packer/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/lance6x5/road-trip-packer/releases/tag/v1.0.0
