# sanity-translations-tab

## 6.1.8

### Patch Changes

- [#1481](https://github.com/sanity-io/plugins/pull/1481) [`0eae652`](https://github.com/sanity-io/plugins/commit/0eae652abea74fd63af2d334707afc8ecd4eb15a) Thanks [@stipsan](https://github.com/stipsan)! - Upgrade `@sanity/pkg-utils` to `^10.9.0`, enabling tree-shaking of unused `styled-components` in the published bundle. Tagged template literals are now transpiled to plain call expressions during build, so bundlers can drop styled components this plugin exports but the app doesn't use, reducing bundle size.

## 6.1.7

### Patch Changes

- [#1471](https://github.com/sanity-io/plugins/pull/1471) [`52487d2`](https://github.com/sanity-io/plugins/commit/52487d208f11fe2a4ccb523fab9386f3fbdd5880) Thanks [@stipsan](https://github.com/stipsan)! - Update `@sanity/icons` to v4 and adopt its per-icon import paths for smaller bundles and faster treeshaking

## 6.1.6

### Patch Changes

- Updated dependencies [[`953cbf5`](https://github.com/sanity-io/plugins/commit/953cbf5c06d7c8a5191ee8534fa0d871b8f7cf0c)]:
  - sanity-naive-html-serializer@5.1.5

## 6.1.5

### Patch Changes

- [#1299](https://github.com/sanity-io/plugins/pull/1299) [`eaa6280`](https://github.com/sanity-io/plugins/commit/eaa6280d729f6e3b4436e7b2fc2556b4580e4afe) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency @portabletext/block-tools to ^5.1.5

- [#1345](https://github.com/sanity-io/plugins/pull/1345) [`c6e8859`](https://github.com/sanity-io/plugins/commit/c6e88593379d8890246f212fb12916f3b99f78d5) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency @portabletext/block-tools to ^5.1.6

- Updated dependencies [[`eaa6280`](https://github.com/sanity-io/plugins/commit/eaa6280d729f6e3b4436e7b2fc2556b4580e4afe), [`c6e8859`](https://github.com/sanity-io/plugins/commit/c6e88593379d8890246f212fb12916f3b99f78d5)]:
  - sanity-naive-html-serializer@5.1.4

## 6.1.4

### Patch Changes

- [`7a37fd1`](https://github.com/sanity-io/plugins/commit/7a37fd1653681de5f892de2dea29b83e9b119ff1) Thanks [@stipsan](https://github.com/stipsan)! - use `workspace:^` for prod deps

## 6.1.3

### Patch Changes

- [#998](https://github.com/sanity-io/plugins/pull/998) [`f63f575`](https://github.com/sanity-io/plugins/commit/f63f5755a25584af6ac41b7f2ef466eb8318584a) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): Update dependency @portabletext/block-tools to v5

- Updated dependencies [[`a57034d`](https://github.com/sanity-io/plugins/commit/a57034d68067548b6366f0f6b2478e1ab4e79875), [`f63f575`](https://github.com/sanity-io/plugins/commit/f63f5755a25584af6ac41b7f2ef466eb8318584a), [`143b038`](https://github.com/sanity-io/plugins/commit/143b0384c48e01d7417676f35a23b23c212a8dce)]:
  - sanity-naive-html-serializer@5.1.3

## 6.1.2

### Patch Changes

- [#980](https://github.com/sanity-io/plugins/pull/980) [`98d148e`](https://github.com/sanity-io/plugins/commit/98d148e00ef679b422e1effe7fc53dfce9cb046c) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Update `@sanity/pkg-utils` to pick up a DTS generation bug fix.

- Updated dependencies [[`98d148e`](https://github.com/sanity-io/plugins/commit/98d148e00ef679b422e1effe7fc53dfce9cb046c)]:
  - sanity-naive-html-serializer@5.1.2

## 6.1.1

### Patch Changes

- [#964](https://github.com/sanity-io/plugins/pull/964) [`4226408`](https://github.com/sanity-io/plugins/commit/4226408594d2717cf2503866f5d5216991701d38) Thanks [@stipsan](https://github.com/stipsan)! - Update `@sanity/util` dependency to v6, in line with Sanity Studio v6

- Updated dependencies [[`4226408`](https://github.com/sanity-io/plugins/commit/4226408594d2717cf2503866f5d5216991701d38)]:
  - sanity-naive-html-serializer@5.1.1

## 6.1.0

### Minor Changes

- [#957](https://github.com/sanity-io/plugins/pull/957) [`310b5fe`](https://github.com/sanity-io/plugins/commit/310b5fe3070eafe89f3cafea48568a3577a3a118) Thanks [@pedrobonamin](https://github.com/pedrobonamin)! - Support both `translation.metadata` data formats. Document-level translation now reads the language from either the legacy `_key` or the new `language` field (`@sanity/document-internationalization` v6), and mirrors the existing document's format when writing. New metadata documents default to the `language` field format, configurable via the new `newMetadataFormat` option (`'language-field' | 'legacy'`).

### Patch Changes

- Updated dependencies [[`310b5fe`](https://github.com/sanity-io/plugins/commit/310b5fe3070eafe89f3cafea48568a3577a3a118)]:
  - sanity-naive-html-serializer@5.1.0

## 6.0.0

### Major Changes

- [#925](https://github.com/sanity-io/plugins/pull/925) [`9f61083`](https://github.com/sanity-io/plugins/commit/9f6108313b213b5bd13238ee4339789b5c15a550) Thanks [@pedrobonamin](https://github.com/pedrobonamin)! - Port sanity-translations-tab to the Sanity plugins monorepo

  This major release includes several breaking changes as part of the migration to the monorepo:

  - **React Compiler enabled**: The package is now built with React Compiler targeting React 19
  - **ESM-only**: CommonJS support has been removed. The package now ships only ESM (previously exposed `require` via `./dist/index.js`)
  - **React 19.2+ required**: Minimum React version is now 19.2 (previously `^18.3 || ^19`)
  - **react-dom 19.2+ required**: Minimum `react-dom` version is now 19.2 (previously `^18.3 || ^19`)
  - **Sanity Studio v5+ required**: Minimum Sanity version is now v5 (Sanity v3 and v4 are no longer supported; previously `^3 || ^4 || ^5`)
  - **Node.js 20.19+ required**: Minimum Node.js version is now 20.19 (previously `>=14`)
  - **styled-components 6.1+ required**: Unchanged peer requirement, now enforced as part of the monorepo build
  - **Removed `@sanity/incompatible-plugin`**: Legacy Sanity v2 compatibility dependency dropped

## [5.2.0](https://github.com/sanity-io/sanity-translations-tab/compare/v5.1.0...v5.2.0) (2026-02-16)

### Features

- add import all functionality ([#57](https://github.com/sanity-io/sanity-translations-tab/issues/57)) ([b5d4605](https://github.com/sanity-io/sanity-translations-tab/commit/b5d460562a2ff7a62ca063401d925ea95eae22dd))

## [5.1.0](https://github.com/sanity-io/sanity-translations-tab/compare/v5.0.0...v5.1.0) (2026-02-16)

### Features

- add i18n array config ([#47](https://github.com/sanity-io/sanity-translations-tab/issues/47)) ([469c5be](https://github.com/sanity-io/sanity-translations-tab/commit/469c5be82558de126ffe0b8d00a171abb44b5357))

## [5.0.0](https://github.com/sanity-io/sanity-translations-tab/compare/v4.4.1...v5.0.0) (2026-01-07)

### ⚠ BREAKING CHANGES

- **deps:** Update dependency sanity-naive-html-serializer to v4 (#56)

### Bug Fixes

- **deps:** Update dependency @sanity/ui to v3 ([#55](https://github.com/sanity-io/sanity-translations-tab/issues/55)) ([126f18c](https://github.com/sanity-io/sanity-translations-tab/commit/126f18c493cfed3d97e3c1595319e445066c79a5))
- **deps:** Update dependency sanity-naive-html-serializer to v4 ([#56](https://github.com/sanity-io/sanity-translations-tab/issues/56)) ([959636f](https://github.com/sanity-io/sanity-translations-tab/commit/959636f0bed7d907a348b0ea89aaf3b02fff9aec))
- **deps:** update sanity monorepo to v5 ([#54](https://github.com/sanity-io/sanity-translations-tab/issues/54)) ([5eac5b6](https://github.com/sanity-io/sanity-translations-tab/commit/5eac5b6d04bba5de4d10f8c725c3e7a84688d8a0))

## [4.4.1](https://github.com/sanity-io/sanity-translations-tab/compare/v4.4.0...v4.4.1) (2026-01-07)

### Bug Fixes

- **deps:** allow studio v5 in peer deps ranges ([#51](https://github.com/sanity-io/sanity-translations-tab/issues/51)) ([39e2df8](https://github.com/sanity-io/sanity-translations-tab/commit/39e2df88c31fcb2157bc969724f133830851abf5))
