# sanity-plugin-dashboard-widget-netlify

## 3.0.13

### Patch Changes

- [#1684](https://github.com/sanity-io/plugins/pull/1684) [`4ea0d1f`](https://github.com/sanity-io/plugins/commit/4ea0d1fd2eeb05b80f38e11aa17ca29390115999) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Update `@sanity/ui` dependency to the latest catalog version.

## 3.0.12

### Patch Changes

- [#1622](https://github.com/sanity-io/plugins/pull/1622) [`6fe3c11`](https://github.com/sanity-io/plugins/commit/6fe3c11e32b8187a19fbdc333e4a8b159fe5a616) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.9

## 3.0.11

### Patch Changes

- [#1596](https://github.com/sanity-io/plugins/pull/1596) [`f06fd76`](https://github.com/sanity-io/plugins/commit/f06fd767531740a09a5755f41fa1d3d42da202ae) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.8

## 3.0.10

### Patch Changes

- [#1571](https://github.com/sanity-io/plugins/pull/1571) [`52975b2`](https://github.com/sanity-io/plugins/commit/52975b2f0d4ea5086c800b2ce16190b862284a95) Thanks [@stipsan](https://github.com/stipsan)! - fix(deps): update tsdown to ^0.22.7 and @sanity/tsdown-config to ^0.14.0

## 3.0.9

### Patch Changes

- [#1519](https://github.com/sanity-io/plugins/pull/1519) [`a11d511`](https://github.com/sanity-io/plugins/commit/a11d511b371b332adc08197711583951eb294166) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.5

## 3.0.8

## 3.0.7

### Patch Changes

- [#1491](https://github.com/sanity-io/plugins/pull/1491) [`2361892`](https://github.com/sanity-io/plugins/commit/236189294b6408c9bced43765e53cf26a11a0e66) Thanks [@stipsan](https://github.com/stipsan)! - Build with `tsdown` instead of `@sanity/pkg-utils`. Internal build-tooling change only, with no intended changes to the public API or runtime behavior.

## 3.0.6

### Patch Changes

- [#1481](https://github.com/sanity-io/plugins/pull/1481) [`0eae652`](https://github.com/sanity-io/plugins/commit/0eae652abea74fd63af2d334707afc8ecd4eb15a) Thanks [@stipsan](https://github.com/stipsan)! - Upgrade `@sanity/pkg-utils` to `^10.9.0`, enabling tree-shaking of unused `styled-components` in the published bundle. Tagged template literals are now transpiled to plain call expressions during build, so bundlers can drop styled components this plugin exports but the app doesn't use, reducing bundle size.

## 3.0.5

## 3.0.4

## 3.0.3

## 3.0.2

## 3.0.1

### Patch Changes

- [#1047](https://github.com/sanity-io/plugins/pull/1047) [`050cc51`](https://github.com/sanity-io/plugins/commit/050cc51e260151b459dbe5d1d79d78302117210e) Thanks [@stipsan](https://github.com/stipsan)! - Add `rel="noopener noreferrer"` to the "Manage sites at Netlify" link that opens in a new tab.

## 3.0.0

### Major Changes

- [#977](https://github.com/sanity-io/plugins/pull/977) [`52d3d1c`](https://github.com/sanity-io/plugins/commit/52d3d1cb2c79ae78d5d2d505e9303532e2c827e7) Thanks [@stipsan](https://github.com/stipsan)! - Port sanity-plugin-dashboard-widget-netlify to the Sanity plugins monorepo

  This major release includes several breaking changes as part of the migration to the monorepo:

  - **React Compiler enabled**: The package is now built with React Compiler targeting React 19
  - **ESM-only**: CommonJS support has been removed. The package now ships only ESM
  - **React 19.2+ required**: Minimum React version is now 19.2 (previously ^18.3 || ^19.2)
  - **Sanity Studio v5+ required**: Minimum Sanity version is now v5 (Sanity v3 and v4 are no longer supported)
  - **@sanity/dashboard v5+ required**: The `@sanity/dashboard` peer dependency range is now ^5 || ^6 (previously ^4.1.4 || ^5)
  - **Node.js 20.19+ required**: Minimum Node.js version is now 20.19 (previously >=18)

  The widget internals were also modernized: the `rxjs`, `react-props-stream`, and `abort-controller` dependencies have been removed in favor of plain React and the Fetch API, with no change in widget behavior.

### Patch Changes

- Updated dependencies [[`52d3d1c`](https://github.com/sanity-io/plugins/commit/52d3d1cb2c79ae78d5d2d505e9303532e2c827e7)]:
  - @sanity/dashboard@6.0.0

## [2.0.4](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/compare/v2.0.3...v2.0.4) (2026-01-07)

### Bug Fixes

- allow `@sanity/dashboard` v5 ([1b10f49](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/commit/1b10f49970b73a7eb26cb978c9a5a2967ea86dce))

## [2.0.3](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/compare/v2.0.2...v2.0.3) (2025-12-29)

### Bug Fixes

- update package.json and package-lock.json to support Sanity v5 ([#94](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/issues/94)) ([9c8dce6](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/commit/9c8dce663bd5e2dd7782fe01d7f67d8f6fc93062))

## [2.0.2](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/compare/v2.0.1...v2.0.2) (2025-07-10)

### Bug Fixes

- **deps:** allow studio v4 peer dep ranges ([c27d307](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/commit/c27d3070aa798b6b9ae491cdc878d5cf59618b2d))
- **deps:** update peer dependencies to include styled components v6 and @sanity/dashboard v4 ([#87](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/issues/87)) ([b83e1af](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/commit/b83e1afd8f0e536eb847a2daa363ef45e0e995d9))

## [2.0.1](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/compare/v2.0.0...v2.0.1) (2022-11-25)

### Bug Fixes

- **deps:** sanity ^3.0.0 (works with rc.3) ([e1c00cd](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/commit/e1c00cd161a42184480c34a9a4aa5f1e949d9edf))

## [2.0.0](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/compare/v1.3.1...v2.0.0) (2022-11-17)

### ⚠ BREAKING CHANGES

- this version does not work in Sanity Studio v2
- initial V3 version

### Features

- initial Sanity Studio v3 release ([5f515bb](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/commit/5f515bbb29beda3bef75ab599fcc73a51d0d447b))
- initial V3 version ([9b6dd57](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/commit/9b6dd57bafecc4e0fae2cfeb6ec2f042b21226d8))

### Bug Fixes

- compiled for sanity 3.0.0-rc.0 ([5cdbed7](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/commit/5cdbed7784fbbc40baf535aa06dbe10d08755838))
- **deps:** dev-preview.21 ([13bcbd5](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/commit/13bcbd5f5580704fb6fd1efb9e492bc518c86c53))
- **deps:** dev-preview.22 ([91ba4ea](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/commit/91ba4eaf77c537b715d1e52ed1d17d1f3322c546))
- **deps:** pkg-utils & @sanity/plugin-kit ([5395a97](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/commit/5395a975aa527079110525d85484c86159bc2cd4))
- **deps:** sanity 3.0.0-dev-preview.17 and sanity/ui 0.38 ([eb19284](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/commit/eb192845f14ba8b8953e154596422cca0c8a3c4c))
- **deps:** update dependencies (non-major) ([#41](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/issues/41)) ([8e1b4fc](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/commit/8e1b4fcd2cc0ac925148a1351adc34821346c871))
- use correct `peerDependencies` semver on prereleases ([7b81060](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/commit/7b810606a547e5612bb33c09f957a7e5dc8c3142))

## [2.0.0-v3-studio.7](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/compare/v2.0.0-v3-studio.6...v2.0.0-v3-studio.7) (2022-11-04)

### Bug Fixes

- **deps:** pkg-utils & @sanity/plugin-kit ([5395a97](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/commit/5395a975aa527079110525d85484c86159bc2cd4))

## [2.0.0-v3-studio.6](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/compare/v2.0.0-v3-studio.5...v2.0.0-v3-studio.6) (2022-11-04)

### Bug Fixes

- **deps:** update dependencies (non-major) ([#41](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/issues/41)) ([8e1b4fc](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/commit/8e1b4fcd2cc0ac925148a1351adc34821346c871))
- use correct `peerDependencies` semver on prereleases ([7b81060](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/commit/7b810606a547e5612bb33c09f957a7e5dc8c3142))

## [2.0.0-v3-studio.5](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/compare/v2.0.0-v3-studio.4...v2.0.0-v3-studio.5) (2022-11-03)

### Bug Fixes

- compiled for sanity 3.0.0-rc.0 ([5cdbed7](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/commit/5cdbed7784fbbc40baf535aa06dbe10d08755838))

## [2.0.0-v3-studio.4](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/compare/v2.0.0-v3-studio.3...v2.0.0-v3-studio.4) (2022-10-27)

### Bug Fixes

- **deps:** dev-preview.22 ([91ba4ea](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/commit/91ba4eaf77c537b715d1e52ed1d17d1f3322c546))

## [2.0.0-v3-studio.3](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/compare/v2.0.0-v3-studio.2...v2.0.0-v3-studio.3) (2022-10-07)

### Bug Fixes

- **deps:** dev-preview.21 ([13bcbd5](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/commit/13bcbd5f5580704fb6fd1efb9e492bc518c86c53))

## [2.0.0-v3-studio.2](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/compare/v2.0.0-v3-studio.1...v2.0.0-v3-studio.2) (2022-09-15)

### Bug Fixes

- **deps:** sanity 3.0.0-dev-preview.17 and sanity/ui 0.38 ([eb19284](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/commit/eb192845f14ba8b8953e154596422cca0c8a3c4c))

## [2.0.0-v3-studio.1](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/compare/v1.3.0...v2.0.0-v3-studio.1) (2022-09-02)

### ⚠ BREAKING CHANGES

- initial V3 version

### Features

- initial V3 version ([9b6dd57](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/commit/9b6dd57bafecc4e0fae2cfeb6ec2f042b21226d8))

### Bug Fixes

- **ci:** semver automation ([a474e7f](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/commit/a474e7f9ba0e7ea005fa53dd8b2c8e674dc03a39))
- compile errors ([32b4546](https://github.com/sanity-io/sanity-plugin-dashboard-widget-netlify/commit/32b45460d1f71c74dc4a40ed6af1d8a839b5423f))
