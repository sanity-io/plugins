# sanity-plugin-studio-smartling

## 5.0.13

### Patch Changes

- Updated dependencies [[`2a3a7ea`](https://github.com/sanity-io/plugins/commit/2a3a7eab8616981991e4a0b345ebe866a5fec8df)]:
  - sanity-translations-tab@6.1.17

## 5.0.12

### Patch Changes

- Updated dependencies [[`4ea0d1f`](https://github.com/sanity-io/plugins/commit/4ea0d1fd2eeb05b80f38e11aa17ca29390115999), [`4ea0d1f`](https://github.com/sanity-io/plugins/commit/4ea0d1fd2eeb05b80f38e11aa17ca29390115999)]:
  - sanity-translations-tab@6.1.16

## 5.0.11

### Patch Changes

- [#1622](https://github.com/sanity-io/plugins/pull/1622) [`6fe3c11`](https://github.com/sanity-io/plugins/commit/6fe3c11e32b8187a19fbdc333e4a8b159fe5a616) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.9

- Updated dependencies [[`6fe3c11`](https://github.com/sanity-io/plugins/commit/6fe3c11e32b8187a19fbdc333e4a8b159fe5a616)]:
  - sanity-translations-tab@6.1.15

## 5.0.10

### Patch Changes

- [#1596](https://github.com/sanity-io/plugins/pull/1596) [`f06fd76`](https://github.com/sanity-io/plugins/commit/f06fd767531740a09a5755f41fa1d3d42da202ae) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.8

- Updated dependencies [[`f06fd76`](https://github.com/sanity-io/plugins/commit/f06fd767531740a09a5755f41fa1d3d42da202ae)]:
  - sanity-translations-tab@6.1.14

## 5.0.9

### Patch Changes

- [#1571](https://github.com/sanity-io/plugins/pull/1571) [`52975b2`](https://github.com/sanity-io/plugins/commit/52975b2f0d4ea5086c800b2ce16190b862284a95) Thanks [@stipsan](https://github.com/stipsan)! - fix(deps): update tsdown to ^0.22.7 and @sanity/tsdown-config to ^0.14.0

- Updated dependencies [[`52975b2`](https://github.com/sanity-io/plugins/commit/52975b2f0d4ea5086c800b2ce16190b862284a95)]:
  - sanity-translations-tab@6.1.13

## 5.0.8

### Patch Changes

- [#1519](https://github.com/sanity-io/plugins/pull/1519) [`a11d511`](https://github.com/sanity-io/plugins/commit/a11d511b371b332adc08197711583951eb294166) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.5

- Updated dependencies [[`a11d511`](https://github.com/sanity-io/plugins/commit/a11d511b371b332adc08197711583951eb294166)]:
  - sanity-translations-tab@6.1.12

## 5.0.7

### Patch Changes

- Updated dependencies []:
  - sanity-translations-tab@6.1.11

## 5.0.6

### Patch Changes

- [#1491](https://github.com/sanity-io/plugins/pull/1491) [`2361892`](https://github.com/sanity-io/plugins/commit/236189294b6408c9bced43765e53cf26a11a0e66) Thanks [@stipsan](https://github.com/stipsan)! - Build with `tsdown` instead of `@sanity/pkg-utils`. Internal build-tooling change only, with no intended changes to the public API or runtime behavior.

- Updated dependencies [[`2361892`](https://github.com/sanity-io/plugins/commit/236189294b6408c9bced43765e53cf26a11a0e66)]:
  - sanity-translations-tab@6.1.10

## 5.0.5

### Patch Changes

- Updated dependencies [[`f50f060`](https://github.com/sanity-io/plugins/commit/f50f0605968e5cec4f23f5f3455abe5c8ddda23c)]:
  - sanity-translations-tab@6.1.9

## 5.0.4

### Patch Changes

- Updated dependencies [[`0eae652`](https://github.com/sanity-io/plugins/commit/0eae652abea74fd63af2d334707afc8ecd4eb15a)]:
  - sanity-translations-tab@6.1.8

## 5.0.3

### Patch Changes

- Updated dependencies [[`52487d2`](https://github.com/sanity-io/plugins/commit/52487d208f11fe2a4ccb523fab9386f3fbdd5880)]:
  - sanity-translations-tab@6.1.7

## 5.0.2

### Patch Changes

- Updated dependencies []:
  - sanity-translations-tab@6.1.6

## 5.0.1

### Patch Changes

- Updated dependencies [[`eaa6280`](https://github.com/sanity-io/plugins/commit/eaa6280d729f6e3b4436e7b2fc2556b4580e4afe), [`c6e8859`](https://github.com/sanity-io/plugins/commit/c6e88593379d8890246f212fb12916f3b99f78d5)]:
  - sanity-translations-tab@6.1.5

## 5.0.0

### Major Changes

- [#975](https://github.com/sanity-io/plugins/pull/975) [`884332f`](https://github.com/sanity-io/plugins/commit/884332f68b5a1eb808201b79dd1fb53bae07e659) Thanks [@cngonzalez](https://github.com/cngonzalez), [@apennell](https://github.com/apennell), [@stipsan](https://github.com/stipsan), [@arthur-pinner](https://github.com/arthur-pinner), [@KJHeartbreaker](https://github.com/KJHeartbreaker), [@RitaDias](https://github.com/RitaDias)! - Port sanity-plugin-studio-smartling to the Sanity plugins monorepo

  This major release includes several breaking changes as part of the migration to the monorepo:

  - **React Compiler enabled**: The plugin is now built with React Compiler targeting React 19
  - **ESM-only**: CommonJS support has been removed. The package now ships only ESM
  - **React 19.2+ required**: Minimum React version is now 19.2 (previously ^18.3 || ^19)
  - **react-dom 19.2+ required**: `react-dom` is now a required peer dependency
  - **Sanity Studio v5+ required**: Minimum Sanity version is now v5 (Sanity v3 and v4 are no longer supported)
  - **Node.js 20.19+ required**: Minimum Node.js version is now 20.19 (previously >=14)
  - **styled-components 6.1+ required**: `styled-components` is now a required peer dependency (required by `sanity-translations-tab`)

## [4.3.3](https://github.com/sanity-io/sanity-plugin-studio-smartling/compare/v4.3.2...v4.3.3) (2026-01-07)

### Bug Fixes

- **deps:** Update dependency sanity-translations-tab to v5 ([#35](https://github.com/sanity-io/sanity-plugin-studio-smartling/issues/35)) ([a64c6d8](https://github.com/sanity-io/sanity-plugin-studio-smartling/commit/a64c6d883ccfecacb5ea5adc335b17008bd5db75))

## [4.3.2](https://github.com/sanity-io/sanity-plugin-studio-smartling/compare/v4.3.1...v4.3.2) (2025-12-29)

### Bug Fixes

- update package.json and package-lock.json to support Sanity v5 ([#34](https://github.com/sanity-io/sanity-plugin-studio-smartling/issues/34)) ([9a8eb09](https://github.com/sanity-io/sanity-plugin-studio-smartling/commit/9a8eb0978b27c4b7c848835645e5c8d99d3d07c3))

## [4.3.1](https://github.com/sanity-io/sanity-plugin-studio-smartling/compare/v4.3.0...v4.3.1) (2025-07-10)

### Bug Fixes

- **deps:** allow studio v4 peer dep ranges ([1e3de60](https://github.com/sanity-io/sanity-plugin-studio-smartling/commit/1e3de60b44d0867bedfb5b91b01c0ee8d6047798))
