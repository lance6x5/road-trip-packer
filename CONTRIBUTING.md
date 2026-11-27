# Contributing to Trunkful

Thanks for helping make Trunkful better!

## Reporting bugs and requesting features

Use the **Feedback** button in the app footer, or open an issue with one of the forms:

- [Bug report](https://github.com/lance6x5/road-trip-packer/issues/new?template=bug_report.yml)
- [Feature request](https://github.com/lance6x5/road-trip-packer/issues/new?template=feature_request.yml)

Please don't include personal data (real names, addresses, or share links to private lists).

## Triage flow

1. **New issue:** every issue from the forms gets the `triage` label (plus `bug` or `enhancement`).
2. **Triage:** the maintainer reviews it, asks questions if needed, then removes `triage` and relabels (or closes it as a duplicate / won't fix).
3. **Work:** changes happen on a branch (e.g. `fix/123-share-link`) and land through a pull request. The PR description references the issue with `Fixes #123` so the issue closes automatically on merge.
4. **Release:** user-visible changes are recorded in [CHANGELOG.md](CHANGELOG.md) under the next version, following [Semantic Versioning](https://semver.org/). Each release is tagged `vX.Y.Z` and published as a GitHub release.

## Local development

```bash
npm install
npm test
npm run dev
```

Pushes to `main` run the tests, build, and deploy to GitHub Pages.
