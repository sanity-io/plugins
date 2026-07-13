# @sanity/language-filter

## 5.0.8

### Patch Changes

- [#1519](https://github.com/sanity-io/plugins/pull/1519) [`a11d511`](https://github.com/sanity-io/plugins/commit/a11d511b371b332adc08197711583951eb294166) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.5

## 5.0.7

### Patch Changes

- [#1493](https://github.com/sanity-io/plugins/pull/1493) [`1a6465d`](https://github.com/sanity-io/plugins/commit/1a6465d2548e8fe8b034f58b89a905a6ad74bd3a) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency react-rx to ^4.2.3

## 5.0.6

### Patch Changes

- [#1491](https://github.com/sanity-io/plugins/pull/1491) [`2361892`](https://github.com/sanity-io/plugins/commit/236189294b6408c9bced43765e53cf26a11a0e66) Thanks [@stipsan](https://github.com/stipsan)! - Build with `tsdown` instead of `@sanity/pkg-utils`. Internal build-tooling change only, with no intended changes to the public API or runtime behavior.

## 5.0.5

### Patch Changes

- [#1471](https://github.com/sanity-io/plugins/pull/1471) [`52487d2`](https://github.com/sanity-io/plugins/commit/52487d208f11fe2a4ccb523fab9386f3fbdd5880) Thanks [@stipsan](https://github.com/stipsan)! - Update `@sanity/icons` to v4 and adopt its per-icon import paths for smaller bundles and faster treeshaking

## 5.0.4

### Patch Changes

- [#980](https://github.com/sanity-io/plugins/pull/980) [`98d148e`](https://github.com/sanity-io/plugins/commit/98d148e00ef679b422e1effe7fc53dfce9cb046c) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Update `@sanity/pkg-utils` to pick up a DTS generation bug fix.

## 5.0.3

### Patch Changes

- [#903](https://github.com/sanity-io/plugins/pull/903) [`2f03c8d`](https://github.com/sanity-io/plugins/commit/2f03c8d98039c29b9d4fd9bc6cd7c09c909c8cc4) Thanks [@bjoerge](https://github.com/bjoerge)! - Widen `sanity` peer-dependency range to `^5 || ^6.0.0-0` to support Sanity Studio v6 (including v6 pre-releases).

## 5.0.2

### Patch Changes

- [#869](https://github.com/sanity-io/plugins/pull/869) [`2a3f19d`](https://github.com/sanity-io/plugins/commit/2a3f19d835dbc75e79cce2a0ccd72b3c561170dd) Thanks [@renovate](https://github.com/apps/renovate)! - Replace deprecated `space` prop with `gap` to address @sanity/ui v3.2.0 deprecation warnings

## 5.0.1

### Patch Changes

- [#781](https://github.com/sanity-io/plugins/pull/781) [`97be48d`](https://github.com/sanity-io/plugins/commit/97be48d860bb9422e933c7865b019a7fe4e977ef) Thanks [@pedrobonamin](https://github.com/pedrobonamin)! - Improve language filter initialization when `supportedLanguages` is resolved asynchronously.

  Selected language hydration now consistently combines default languages with persisted language selections, and keeps filtering constrained to supported/selectable languages.

## 5.0.0

### Major Changes

- [#586](https://github.com/sanity-io/plugins/pull/586) [`1978fb4`](https://github.com/sanity-io/plugins/commit/1978fb442137427270d1573f8e01541311bfb05c) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Port @sanity/language-filter to the Sanity plugins monorepo

  This major release includes several breaking changes as part of the migration to the monorepo:

  - **React Compiler enabled**: The plugin is now optimized with React Compiler targeting React 19
  - **ESM-only**: CommonJS support has been removed. The plugin now only exports ES modules
  - **Sanity Studio v5 required**: The plugin now requires Sanity Studio v5 as the minimum version
  - **React 19 required**: The plugin now requires React 19.2 or later
  - **Node.js 20.19+ required**: The plugin now requires Node.js 20.19 or later (or 22.12+)
  - **styled-components removed**: Removed styled-components dependency - styles now use inline styles
  - **Language subscription bus removed**: The `languageSubscription.ts` module and its exports (`createSelectedLanguageIdsBus`, `SelectedLanguageIdsBus`, `LanguageSubscription`, `Unsubscribe`, `LanguageSubscribe`) have been removed. State management now uses React Context via `LanguageFilterStudioContext` instead of the subscription bus pattern.

  **Modernization:**

  - Replaced deprecated `useClickOutside` hook with `useClickOutsideEvent`
  - Fixed FormEvent usage with proper React.ChangeEvent
  - Added explicit return type annotations for better TypeScript compatibility
  - Removed styled-components

  **Testing:**

  - Converted from Jest to Vitest for testing
  - Added package exports validation test

## 4.1.0 (2026-02-17)

- feat: add parentValue to filterField function (#77) ([8d75fdb](https://github.com/sanity-io/language-filter/commit/8d75fdb)), closes [#77](https://github.com/sanity-io/language-filter/issues/77)
- Revert "chore: add parentValue to filterField function (#75)" (#76) ([57d99ef](https://github.com/sanity-io/language-filter/commit/57d99ef)), closes [#75](https://github.com/sanity-io/language-filter/issues/75) [#76](https://github.com/sanity-io/language-filter/issues/76) [#75](https://github.com/sanity-io/language-filter/issues/75)
- chore: add parentValue to filterField function (#75) ([193ec36](https://github.com/sanity-io/language-filter/commit/193ec36)), closes [#75](https://github.com/sanity-io/language-filter/issues/75)

## <small>4.0.6 (2025-12-17)</small>

- fix(deps): allow sanity v5 as peer dependency (#74) ([f472f43](https://github.com/sanity-io/language-filter/commit/f472f43)), closes [#74](https://github.com/sanity-io/language-filter/issues/74)
- Update README.md ([e363cec](https://github.com/sanity-io/language-filter/commit/e363cec))

## [4.0.5](https://github.com/sanity-io/language-filter/compare/v4.0.4...v4.0.5) (2025-07-10)

### Bug Fixes

- **deps:** allow studio v4 in peer dep ranges ([#73](https://github.com/sanity-io/language-filter/issues/73)) ([14abbd1](https://github.com/sanity-io/language-filter/commit/14abbd11cc8090ed504a8cdef04d7f3d1cf95248))

## [4.0.4](https://github.com/sanity-io/language-filter/compare/v4.0.3...v4.0.4) (2025-03-31)

### Bug Fixes

- prevent the plugin from filtering out 'FieldError' members ([c551683](https://github.com/sanity-io/language-filter/commit/c551683302803290d133b0f67d0c6bb966c6e5a5))

## [4.0.3](https://github.com/sanity-io/language-filter/compare/v4.0.2...v4.0.3) (2024-12-17)

### Bug Fixes

- make `@sanity/util` a regular dependency again ([15b9f6c](https://github.com/sanity-io/language-filter/commit/15b9f6c0b546f671ab4de0eca216251ed5dbc305))
- make react 19 compatible ([#70](https://github.com/sanity-io/language-filter/issues/70)) ([1c92729](https://github.com/sanity-io/language-filter/commit/1c927297a5107e14e8128d05fa9065e26edefc9d))

## [4.0.2](https://github.com/sanity-io/language-filter/compare/v4.0.1...v4.0.2) (2024-04-09)

### Bug Fixes

- animate popover ([6ec06c8](https://github.com/sanity-io/language-filter/commit/6ec06c86d3585ecf5fc7c20c69e783bf31270753))

## [4.0.1](https://github.com/sanity-io/language-filter/compare/v4.0.0...v4.0.1) (2024-04-09)

### Bug Fixes

- add provenance ([4f99791](https://github.com/sanity-io/language-filter/commit/4f99791881ab96a16c455d466d184b56b0020402))

## [4.0.0](https://github.com/sanity-io/language-filter/compare/v3.2.2...v4.0.0) (2024-04-09)

### ⚠ BREAKING CHANGES

- support strictESM

### Features

- support strictESM ([810c823](https://github.com/sanity-io/language-filter/commit/810c823773b203711ffe2089657fff8958cc6020))

## [3.2.2](https://github.com/sanity-io/language-filter/compare/v3.2.1...v3.2.2) (2024-01-19)

### Bug Fixes

- update dependencies ([#61](https://github.com/sanity-io/language-filter/issues/61)) ([dee0b9f](https://github.com/sanity-io/language-filter/commit/dee0b9f6fe1b93bca75bfef43ce1cbcca7c1a6c4))

## [3.2.1](https://github.com/sanity-io/language-filter/compare/v3.2.0...v3.2.1) (2023-07-20)

### Bug Fixes

- ensure filterField runs on schema-configured types ([cbd7e6f](https://github.com/sanity-io/language-filter/commit/cbd7e6f35df79aec622449945de871674e1bca0e))

## [3.2.0](https://github.com/sanity-io/language-filter/compare/v3.1.2...v3.2.0) (2023-07-17)

### Features

- async language support ([#48](https://github.com/sanity-io/language-filter/issues/48)) ([72dce7e](https://github.com/sanity-io/language-filter/commit/72dce7ee50b45d46be02e740ef1da980474319b7))

## [3.1.2](https://github.com/sanity-io/language-filter/compare/v3.1.1...v3.1.2) (2023-06-19)

### Bug Fixes

- menu was open-by-default, better gif ([#45](https://github.com/sanity-io/language-filter/issues/45)) ([c40792d](https://github.com/sanity-io/language-filter/commit/c40792d360c326701dcd52ceaf52f108f79cae5c))

## [3.1.1](https://github.com/sanity-io/language-filter/compare/v3.1.0...v3.1.1) (2023-06-19)

### Bug Fixes

- issue with defaultLanguages ([#44](https://github.com/sanity-io/language-filter/issues/44)) ([4e038d7](https://github.com/sanity-io/language-filter/commit/4e038d7f0615cb7454ca4d1a80530bc1e7b3382f))

## [3.1.0](https://github.com/sanity-io/language-filter/compare/v3.0.1...v3.1.0) (2023-06-19)

### Features

- new studio-wide context and exported hooks ([#43](https://github.com/sanity-io/language-filter/issues/43)) ([cc99912](https://github.com/sanity-io/language-filter/commit/cc999120507d3de7e54385166afce26008210066))

## [3.0.1](https://github.com/sanity-io/language-filter/compare/v3.0.0...v3.0.1) (2023-03-08)

### Bug Fixes

- prevent dropdown overflow when language list is too long ([62256cd](https://github.com/sanity-io/language-filter/commit/62256cdc3d771e4ded14a80ad0e13ae5610a4bfa)), closes [#27](https://github.com/sanity-io/language-filter/issues/27)

## [3.0.0](https://github.com/sanity-io/language-filter/compare/v2.35.2...v3.0.0) (2022-11-25)

### ⚠ BREAKING CHANGES

- initial Sanity Studio v3 release

### Features

- initial Sanity Studio v3 release ([750f13a](https://github.com/sanity-io/language-filter/commit/750f13af998dd7149f97489933eb5677cba0c1fe))
- initial v3 plugin impl ([#4](https://github.com/sanity-io/language-filter/issues/4)) ([0bc3072](https://github.com/sanity-io/language-filter/commit/0bc3072ee852e62dc1b2ce957b3a3aa798f37e7f))

### Bug Fixes

- compiled for sanity 3.0.0-rc.0 ([67b94ea](https://github.com/sanity-io/language-filter/commit/67b94ead55f4cda1ff981b2d5665a98d3b810473))
- **deps:** @sanity/util ([2c00b6e](https://github.com/sanity-io/language-filter/commit/2c00b6e6f39ad9cb5c873a807059809b0c58d9b3))
- **deps:** dev-preview.21 ([96b2250](https://github.com/sanity-io/language-filter/commit/96b2250050de0d417fa894061c4f34158974919c))
- **deps:** dev-preview.22 ([36658f2](https://github.com/sanity-io/language-filter/commit/36658f2a6821dce0188b4bdc8d187d46b06fa063))
- **deps:** pin dependencies ([#12](https://github.com/sanity-io/language-filter/issues/12)) ([6dc9c88](https://github.com/sanity-io/language-filter/commit/6dc9c8896b51871a48267658845767ef1f6e8b0e))
- **deps:** pkg-utils & @sanity/plugin-kit ([5359efc](https://github.com/sanity-io/language-filter/commit/5359efc2a82da556b5b3db5ea2c1f370a5401cd9))
- **deps:** sanity 3.0.0-dev-preview.17 ([efc0030](https://github.com/sanity-io/language-filter/commit/efc003094b3018c7842f0019d19c4cede7fedc3e))
- **deps:** update sanity-ui-pin ([#13](https://github.com/sanity-io/language-filter/issues/13)) ([d061ad7](https://github.com/sanity-io/language-filter/commit/d061ad7b28ad3d5c5d17e757c0e57e3388541663))
- documents without languge-filter should no longer crash ([6bffbe7](https://github.com/sanity-io/language-filter/commit/6bffbe7d1051be45f7f3a0c49e281305b929f857))
- fields within fieldsets are now filtered ([afb7c14](https://github.com/sanity-io/language-filter/commit/afb7c1496fef4fe088fdfdd8af58fb789d7835d7))
- removed some exports ([7656488](https://github.com/sanity-io/language-filter/commit/7656488f7ad876e3e8b1898ca003d1fc15a3a491))

## [2.36.0](https://github.com/sanity-io/language-filter/compare/v2.35.2...v2.36.0) (2022-11-25)

### Features

- initial v3 plugin impl ([#4](https://github.com/sanity-io/language-filter/issues/4)) ([0bc3072](https://github.com/sanity-io/language-filter/commit/0bc3072ee852e62dc1b2ce957b3a3aa798f37e7f))

### Bug Fixes

- compiled for sanity 3.0.0-rc.0 ([67b94ea](https://github.com/sanity-io/language-filter/commit/67b94ead55f4cda1ff981b2d5665a98d3b810473))
- **deps:** @sanity/util ([2c00b6e](https://github.com/sanity-io/language-filter/commit/2c00b6e6f39ad9cb5c873a807059809b0c58d9b3))
- **deps:** dev-preview.21 ([96b2250](https://github.com/sanity-io/language-filter/commit/96b2250050de0d417fa894061c4f34158974919c))
- **deps:** dev-preview.22 ([36658f2](https://github.com/sanity-io/language-filter/commit/36658f2a6821dce0188b4bdc8d187d46b06fa063))
- **deps:** pin dependencies ([#12](https://github.com/sanity-io/language-filter/issues/12)) ([6dc9c88](https://github.com/sanity-io/language-filter/commit/6dc9c8896b51871a48267658845767ef1f6e8b0e))
- **deps:** pkg-utils & @sanity/plugin-kit ([5359efc](https://github.com/sanity-io/language-filter/commit/5359efc2a82da556b5b3db5ea2c1f370a5401cd9))
- **deps:** sanity ^3.0.0 (works with rc.3) ([8480344](https://github.com/sanity-io/language-filter/commit/84803444bcf7dc9a5df072cae7d76ce6edf77de6))
- **deps:** sanity 3.0.0-dev-preview.17 ([efc0030](https://github.com/sanity-io/language-filter/commit/efc003094b3018c7842f0019d19c4cede7fedc3e))
- **deps:** update sanity-ui-pin ([#13](https://github.com/sanity-io/language-filter/issues/13)) ([d061ad7](https://github.com/sanity-io/language-filter/commit/d061ad7b28ad3d5c5d17e757c0e57e3388541663))
- documents without languge-filter should no longer crash ([6bffbe7](https://github.com/sanity-io/language-filter/commit/6bffbe7d1051be45f7f3a0c49e281305b929f857))
- fields within fieldsets are now filtered ([afb7c14](https://github.com/sanity-io/language-filter/commit/afb7c1496fef4fe088fdfdd8af58fb789d7835d7))
- removed some exports ([7656488](https://github.com/sanity-io/language-filter/commit/7656488f7ad876e3e8b1898ca003d1fc15a3a491))

## [3.0.0-v3-studio.10](https://github.com/sanity-io/language-filter/compare/v3.0.0-v3-studio.9...v3.0.0-v3-studio.10) (2022-11-04)

### Bug Fixes

- **deps:** pkg-utils & @sanity/plugin-kit ([5359efc](https://github.com/sanity-io/language-filter/commit/5359efc2a82da556b5b3db5ea2c1f370a5401cd9))

## [3.0.0-v3-studio.9](https://github.com/sanity-io/language-filter/compare/v3.0.0-v3-studio.8...v3.0.0-v3-studio.9) (2022-11-04)

### Bug Fixes

- **deps:** pin dependencies ([#12](https://github.com/sanity-io/language-filter/issues/12)) ([6dc9c88](https://github.com/sanity-io/language-filter/commit/6dc9c8896b51871a48267658845767ef1f6e8b0e))
- **deps:** update sanity-ui-pin ([#13](https://github.com/sanity-io/language-filter/issues/13)) ([d061ad7](https://github.com/sanity-io/language-filter/commit/d061ad7b28ad3d5c5d17e757c0e57e3388541663))

## [3.0.0-v3-studio.8](https://github.com/sanity-io/language-filter/compare/v3.0.0-v3-studio.7...v3.0.0-v3-studio.8) (2022-11-03)

### Bug Fixes

- **deps:** @sanity/util ([2c00b6e](https://github.com/sanity-io/language-filter/commit/2c00b6e6f39ad9cb5c873a807059809b0c58d9b3))

## [3.0.0-v3-studio.7](https://github.com/sanity-io/language-filter/compare/v3.0.0-v3-studio.6...v3.0.0-v3-studio.7) (2022-11-03)

### Bug Fixes

- compiled for sanity 3.0.0-rc.0 ([67b94ea](https://github.com/sanity-io/language-filter/commit/67b94ead55f4cda1ff981b2d5665a98d3b810473))

## [3.0.0-v3-studio.6](https://github.com/sanity-io/language-filter/compare/v3.0.0-v3-studio.5...v3.0.0-v3-studio.6) (2022-10-27)

### Bug Fixes

- **deps:** dev-preview.22 ([36658f2](https://github.com/sanity-io/language-filter/commit/36658f2a6821dce0188b4bdc8d187d46b06fa063))

## [3.0.0-v3-studio.5](https://github.com/sanity-io/language-filter/compare/v3.0.0-v3-studio.4...v3.0.0-v3-studio.5) (2022-10-07)

### Bug Fixes

- **deps:** dev-preview.21 ([96b2250](https://github.com/sanity-io/language-filter/commit/96b2250050de0d417fa894061c4f34158974919c))

## [3.0.0-v3-studio.4](https://github.com/sanity-io/language-filter/compare/v3.0.0-v3-studio.3...v3.0.0-v3-studio.4) (2022-09-15)

### Bug Fixes

- documents without languge-filter should no longer crash ([6bffbe7](https://github.com/sanity-io/language-filter/commit/6bffbe7d1051be45f7f3a0c49e281305b929f857))

## [3.0.0-v3-studio.3](https://github.com/sanity-io/language-filter/compare/v3.0.0-v3-studio.2...v3.0.0-v3-studio.3) (2022-09-15)

### Bug Fixes

- **deps:** sanity 3.0.0-dev-preview.17 ([efc0030](https://github.com/sanity-io/language-filter/commit/efc003094b3018c7842f0019d19c4cede7fedc3e))

## [3.0.0-v3-studio.2](https://github.com/sanity-io/language-filter/compare/v3.0.0-v3-studio.1...v3.0.0-v3-studio.2) (2022-08-31)

### Bug Fixes

- fields within fieldsets are now filtered ([afb7c14](https://github.com/sanity-io/language-filter/commit/afb7c1496fef4fe088fdfdd8af58fb789d7835d7))

## [3.0.0-v3-studio.1](https://github.com/sanity-io/language-filter/compare/v3.0.0-v3-studio.0...v3.0.0-v3-studio.1) (2022-08-31)

### Bug Fixes

- removed some exports ([7656488](https://github.com/sanity-io/language-filter/commit/7656488f7ad876e3e8b1898ca003d1fc15a3a491))

## 1.0.0-firstpass-v3-impl.1 (2022-08-29)

### Features

- initial v3 plugin impl ([f745b63](https://github.com/sanity-io/language-filter/commit/f745b6354ffb087e558b566bf290ed7e973bec1a))
