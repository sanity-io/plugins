# sanity-plugin-transifex

## 5.1.2

### Patch Changes

- [#980](https://github.com/sanity-io/plugins/pull/980) [`98d148e`](https://github.com/sanity-io/plugins/commit/98d148e00ef679b422e1effe7fc53dfce9cb046c) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Update `@sanity/pkg-utils` to pick up a DTS generation bug fix.

- Updated dependencies [[`98d148e`](https://github.com/sanity-io/plugins/commit/98d148e00ef679b422e1effe7fc53dfce9cb046c)]:
  - sanity-translations-tab@6.1.2

## 5.1.1

### Patch Changes

- Updated dependencies [[`4226408`](https://github.com/sanity-io/plugins/commit/4226408594d2717cf2503866f5d5216991701d38)]:
  - sanity-translations-tab@6.1.1

## 5.1.0

### Minor Changes

- [#957](https://github.com/sanity-io/plugins/pull/957) [`310b5fe`](https://github.com/sanity-io/plugins/commit/310b5fe3070eafe89f3cafea48568a3577a3a118) Thanks [@pedrobonamin](https://github.com/pedrobonamin)! - Add a `defaultI18nArrayConfig` export (and `i18nArrayPatch` re-export) for documents using `sanity-plugin-internationalized-array` fields, and support both the legacy and new internationalized array / `translation.metadata` data formats via updated `sanity-translations-tab` and `sanity-naive-html-serializer` dependencies.

### Patch Changes

- Updated dependencies [[`310b5fe`](https://github.com/sanity-io/plugins/commit/310b5fe3070eafe89f3cafea48568a3577a3a118)]:
  - sanity-translations-tab@6.1.0

## 5.0.0

### Major Changes

- [#932](https://github.com/sanity-io/plugins/pull/932) [`bab3a4a`](https://github.com/sanity-io/plugins/commit/bab3a4a48eb168e583d5d768f1e72f5edc68c483) Thanks [@pedrobonamin](https://github.com/pedrobonamin)! - Port sanity-plugin-transifex to the Sanity plugins monorepo

  This major release includes several breaking changes as part of the migration to the monorepo:
  - **React Compiler enabled**: The plugin is now built with React Compiler targeting React 19
  - **ESM-only**: CommonJS support has been removed. The package now ships only ESM
  - **React 19.2+ required**: Minimum React version is now 19.2 (previously ^18.3 || ^19)
  - **react-dom 19.2+ required**: Minimum react-dom version is now 19.2 (previously ^18.3 || ^19)
  - **Sanity Studio v5+ required**: Minimum Sanity version is now v5 (Sanity v3 and v4 are no longer supported)
  - **Node.js 20.19+ required**: Minimum Node.js version is now 20.19 (previously >=18)
  - **styled-components 6.1+ required**: `styled-components` is now a required peer dependency (required by `sanity-translations-tab`)

## [4.0.3](https://github.com/sanity-io/sanity-plugin-transifex/compare/v4.0.2...v4.0.3) (2026-01-07)

### Bug Fixes

- **deps:** Update dependency sanity-translations-tab to v5 ([#25](https://github.com/sanity-io/sanity-plugin-transifex/issues/25)) ([3560908](https://github.com/sanity-io/sanity-plugin-transifex/commit/3560908bac206524c8bedb6791894f604aacf88c))

## [4.0.2](https://github.com/sanity-io/sanity-plugin-transifex/compare/v4.0.1...v4.0.2) (2025-12-29)

### Bug Fixes

- update package.json and package-lock.json to support Sanity v5 ([#24](https://github.com/sanity-io/sanity-plugin-transifex/issues/24)) ([c74ad09](https://github.com/sanity-io/sanity-plugin-transifex/commit/c74ad09af001f0debe643375d35f576dda510b0f))

## [4.0.1](https://github.com/sanity-io/sanity-plugin-transifex/compare/v4.0.0...v4.0.1) (2025-07-10)

### Bug Fixes

- **deps:** allow studio v4 peer dep ranges ([87eaba9](https://github.com/sanity-io/sanity-plugin-transifex/commit/87eaba909a1e15920e77e6ff1b8417d694344b72))
