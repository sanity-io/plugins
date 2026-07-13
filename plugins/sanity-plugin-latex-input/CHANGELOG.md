# sanity-plugin-latex-input

## 3.0.4

### Patch Changes

- [#1519](https://github.com/sanity-io/plugins/pull/1519) [`a11d511`](https://github.com/sanity-io/plugins/commit/a11d511b371b332adc08197711583951eb294166) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.5

## 3.0.3

### Patch Changes

- [#1491](https://github.com/sanity-io/plugins/pull/1491) [`2361892`](https://github.com/sanity-io/plugins/commit/236189294b6408c9bced43765e53cf26a11a0e66) Thanks [@stipsan](https://github.com/stipsan)! - Build with `tsdown` instead of `@sanity/pkg-utils`. Internal build-tooling change only, with no intended changes to the public API or runtime behavior.

## 3.0.2

### Patch Changes

- [#1460](https://github.com/sanity-io/plugins/pull/1460) [`f50f060`](https://github.com/sanity-io/plugins/commit/f50f0605968e5cec4f23f5f3455abe5c8ddda23c) Thanks [@stipsan](https://github.com/stipsan)! - Regenerate TypeScript declaration output: `isolatedDeclarations` is no longer used and declarations are now generated with tsgo (`@typescript/native-preview`). Internal build-tooling change only, with no runtime behavior or public API changes.

## 3.0.1

### Patch Changes

- [#980](https://github.com/sanity-io/plugins/pull/980) [`98d148e`](https://github.com/sanity-io/plugins/commit/98d148e00ef679b422e1effe7fc53dfce9cb046c) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Update `@sanity/pkg-utils` to pick up a DTS generation bug fix.

## 3.0.0

### Major Changes

- [#905](https://github.com/sanity-io/plugins/pull/905) [`6d83783`](https://github.com/sanity-io/plugins/commit/6d8378397790fb87fb0142e490bbc7624a82ef17) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Migrated from standalone repository (https://github.com/sanity-io/latex-input) into the plugins monorepo.

  Breaking changes:

  - Now requires React 19.2+ and Sanity Studio v5+
  - CJS output dropped; ESM only
  - React Compiler enabled
  - `LatexPreview` component rewritten to derive HTML directly from props (no internal state)
  - Module augmentation moved from `@sanity/types` to `sanity`

## [2.0.7](https://github.com/sanity-io/latex-input/compare/v2.0.6...v2.0.7) (2026-01-07)

### Bug Fixes

- add schema title ([#30](https://github.com/sanity-io/latex-input/issues/30)) ([dd03be5](https://github.com/sanity-io/latex-input/commit/dd03be5c521f3a5219122920e4f5df87908dc740))
- update package.json and package-lock.json to support Sanity v5 ([#55](https://github.com/sanity-io/latex-input/issues/55)) ([88efc4e](https://github.com/sanity-io/latex-input/commit/88efc4ec408dcfa2e415d7e09e6885ac01c4fc48))

## [2.0.6](https://github.com/sanity-io/latex-input/compare/v2.0.5...v2.0.6) (2025-07-10)

### Bug Fixes

- **deps:** allow studio v4 in peer dep ranges ([#54](https://github.com/sanity-io/latex-input/issues/54)) ([223f2e4](https://github.com/sanity-io/latex-input/commit/223f2e4cc94f00bbd3de0160b9a2929e0d272a63))

## [2.0.5](https://github.com/sanity-io/latex-input/compare/v2.0.4...v2.0.5) (2024-11-06)

### Bug Fixes

- **deps:** update non-major ([#33](https://github.com/sanity-io/latex-input/issues/33)) ([a10a49a](https://github.com/sanity-io/latex-input/commit/a10a49aed83ad132cb41c9907b06a042089e4115))
- remove unnecessary styled-components dependency ([#52](https://github.com/sanity-io/latex-input/issues/52)) ([d30fab7](https://github.com/sanity-io/latex-input/commit/d30fab745ac44bb5eafc6df20ffdc1093d1739fd))

### [2.0.4](https://github.com/sanity-io/latex-input/compare/v2.0.3...v2.0.4) (2022-12-06)

### Bug Fixes

- preview works in portable text and arrays in sanity 3.0.0+ ([d2cc3b6](https://github.com/sanity-io/latex-input/commit/d2cc3b6cf1bc54fbfa0fe9ee3f68dec231161e62))

### [2.0.3](https://github.com/sanity-io/latex-input/compare/v2.0.2...v2.0.3) (2022-11-25)

### Bug Fixes

- **deps:** sanity ^3.0.0 (rc.3 compatible) ([0d83c2d](https://github.com/sanity-io/latex-input/commit/0d83c2dba3e709aa2c7762a17cb0b0f153dfe69c))

### [2.0.2](https://github.com/sanity-io/latex-input/compare/v2.0.1...v2.0.2) (2022-11-15)

### Bug Fixes

- corrected v2 version link ([a128304](https://github.com/sanity-io/latex-input/commit/a128304d186195fd31c6d3dfb8584a54ce3dde0f))

### [2.0.1](https://github.com/sanity-io/latex-input/compare/v2.0.0...v2.0.1) (2022-11-15)

### Bug Fixes

- **docs:** updated install command ([2ffd0cf](https://github.com/sanity-io/latex-input/commit/2ffd0cf32c384f430ea743fd6f088c076568f6d7))

## [2.0.0](https://github.com/sanity-io/latex-input/compare/v1.0.0...v2.0.0) (2022-11-15)

### ⚠ BREAKING CHANGES

- this version only works in sanity V3
- this version does not work in Studio V2

### Features

- initial studio v3 version ([37cdfdb](https://github.com/sanity-io/latex-input/commit/37cdfdbe97be334b1b1c8fb731f90aa410b92c31))
- initial V3 release ([9515402](https://github.com/sanity-io/latex-input/commit/9515402b182c741575f27021e434030f50326646))

### Bug Fixes

- branchname ([a49af98](https://github.com/sanity-io/latex-input/commit/a49af983a6118a318ac563165fd695f937df2de2))
- **ci:** added semver workflow ([add8f89](https://github.com/sanity-io/latex-input/commit/add8f89d61eb89df3fc4d0fb6b9c826b2961688e))
- compiled for sanity 3.0.0-rc.0 ([b008c1c](https://github.com/sanity-io/latex-input/commit/b008c1cbc2e77dd28c4fd3ea6cfc9a1202cef726))
- **deps:** dev-preview.21 ([d1ae97f](https://github.com/sanity-io/latex-input/commit/d1ae97f1ca23e2d72e7e8a45c7286c974199b8b2))
- **deps:** dev-preview.22 ([05b8ad1](https://github.com/sanity-io/latex-input/commit/05b8ad10c3fafc2e0b04b9f55159896f7999f763))
- **deps:** pkg-utils & @sanity/plugin-kit ([5a5e9cf](https://github.com/sanity-io/latex-input/commit/5a5e9cf4d157fbde51e2cd2657e8feccf53ff1c4))
- **deps:** sanity 3.0.0-dev-preview.17 ([c9e98da](https://github.com/sanity-io/latex-input/commit/c9e98da53bf37d0a38164371b8f6176da54c5b6f))

## [0.3.0-v3-studio.5](https://github.com/sanity-io/latex-input/compare/v0.3.0-v3-studio.4...v0.3.0-v3-studio.5) (2022-11-04)

### Bug Fixes

- **deps:** pkg-utils & @sanity/plugin-kit ([5a5e9cf](https://github.com/sanity-io/latex-input/commit/5a5e9cf4d157fbde51e2cd2657e8feccf53ff1c4))

## [0.3.0-v3-studio.4](https://github.com/sanity-io/latex-input/compare/v0.3.0-v3-studio.3...v0.3.0-v3-studio.4) (2022-11-03)

### Bug Fixes

- compiled for sanity 3.0.0-rc.0 ([b008c1c](https://github.com/sanity-io/latex-input/commit/b008c1cbc2e77dd28c4fd3ea6cfc9a1202cef726))

## [0.3.0-v3-studio.3](https://github.com/sanity-io/latex-input/compare/v0.3.0-v3-studio.2...v0.3.0-v3-studio.3) (2022-10-27)

### Bug Fixes

- **deps:** dev-preview.22 ([05b8ad1](https://github.com/sanity-io/latex-input/commit/05b8ad10c3fafc2e0b04b9f55159896f7999f763))

## [0.3.0-v3-studio.2](https://github.com/sanity-io/latex-input/compare/v0.3.0-v3-studio.1...v0.3.0-v3-studio.2) (2022-10-07)

### Bug Fixes

- **deps:** dev-preview.21 ([d1ae97f](https://github.com/sanity-io/latex-input/commit/d1ae97f1ca23e2d72e7e8a45c7286c974199b8b2))
- **deps:** sanity 3.0.0-dev-preview.17 ([c9e98da](https://github.com/sanity-io/latex-input/commit/c9e98da53bf37d0a38164371b8f6176da54c5b6f))

## [0.3.0-v3-studio.1](https://github.com/sanity-io/latex-input/compare/v0.3.0-v3-studio.0...v0.3.0-v3-studio.1) (2022-09-14)

### Bug Fixes

- branchname ([a49af98](https://github.com/sanity-io/latex-input/commit/a49af983a6118a318ac563165fd695f937df2de2))
- **ci:** added semver workflow ([add8f89](https://github.com/sanity-io/latex-input/commit/add8f89d61eb89df3fc4d0fb6b9c826b2961688e))
