# sanity-plugin-shopify-assets

## 2.0.4

### Patch Changes

- [#1481](https://github.com/sanity-io/plugins/pull/1481) [`0eae652`](https://github.com/sanity-io/plugins/commit/0eae652abea74fd63af2d334707afc8ecd4eb15a) Thanks [@stipsan](https://github.com/stipsan)! - Upgrade `@sanity/pkg-utils` to `^10.9.0`, enabling tree-shaking of unused `styled-components` in the published bundle. Tagged template literals are now transpiled to plain call expressions during build, so bundlers can drop styled components this plugin exports but the app doesn't use, reducing bundle size.

## 2.0.3

### Patch Changes

- [#1471](https://github.com/sanity-io/plugins/pull/1471) [`52487d2`](https://github.com/sanity-io/plugins/commit/52487d208f11fe2a4ccb523fab9386f3fbdd5880) Thanks [@stipsan](https://github.com/stipsan)! - Update `@sanity/icons` to v4 and adopt its per-icon import paths for smaller bundles and faster treeshaking

## 2.0.2

### Patch Changes

- [#1446](https://github.com/sanity-io/plugins/pull/1446) [`efb2556`](https://github.com/sanity-io/plugins/commit/efb25564fce4ced8c6488772ca4dd4261b498e95) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency axios to ^1.18.1

## 2.0.1

### Patch Changes

- [#1301](https://github.com/sanity-io/plugins/pull/1301) [`0ae4670`](https://github.com/sanity-io/plugins/commit/0ae46700585f4b91e133f02f0ce688b604482e5f) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency @sanity/icons to ^3.7.4

- [#1308](https://github.com/sanity-io/plugins/pull/1308) [`473a607`](https://github.com/sanity-io/plugins/commit/473a6078bb35f0328da1549cf11c17b2d3cc66f4) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency axios to ^1.18.0

- [#1319](https://github.com/sanity-io/plugins/pull/1319) [`b1d1952`](https://github.com/sanity-io/plugins/commit/b1d1952026bede5c7e44ab00b4045f4b9bed0f92) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency pretty-bytes to ^6.1.1

- [#1323](https://github.com/sanity-io/plugins/pull/1323) [`c502e3b`](https://github.com/sanity-io/plugins/commit/c502e3b7e7ecac673629776184aceff64468f564) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency react-infinite-scroll-component to ^6.1.1

- [#1324](https://github.com/sanity-io/plugins/pull/1324) [`7db3761`](https://github.com/sanity-io/plugins/commit/7db3761bb1a594de526200e080cf2a084926af1c) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency react-photo-album to ^2.4.1

- [#1332](https://github.com/sanity-io/plugins/pull/1332) [`e2aa3d5`](https://github.com/sanity-io/plugins/commit/e2aa3d5a7cf0f7bb3e5cf67d9a21b1b19074d03f) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency video.js to ^7.21.7

## 2.0.0

### Major Changes

- [#976](https://github.com/sanity-io/plugins/pull/976) [`0cccf18`](https://github.com/sanity-io/plugins/commit/0cccf1808d4e7a3be1a612ca194e5269e8b8aff7) Thanks [@thebiggianthead](https://github.com/thebiggianthead), [@rexxars](https://github.com/rexxars), [@RitaDias](https://github.com/RitaDias), [@stipsan](https://github.com/stipsan), [@bjoerge](https://github.com/bjoerge), [@KJHeartbreaker](https://github.com/KJHeartbreaker), [@Mtillmann](https://github.com/Mtillmann), [@tobiasvielmetter](https://github.com/tobiasvielmetter)! - Port sanity-plugin-shopify-assets to the Sanity plugins monorepo

  This major release includes several breaking changes as part of the migration to the monorepo:

  - **React Compiler enabled**: The package is now built with React Compiler targeting React 19
  - **ESM-only**: CommonJS support has been removed. The package now ships only ESM
  - **React 19.2+ required**: Minimum React version is now 19.2 (previously ^18.3 || ^19)
  - **react-dom 19.2+ required**: `react-dom` is now a required peer dependency
  - **Sanity Studio v5+ required**: Minimum Sanity version is now v5 (Sanity v3 and v4 are no longer supported)
  - **styled-components 6.1+ required**: Minimum styled-components version is now 6.1 (previously ^6)
  - **Node.js 20.19+ required**: Minimum Node.js version is now 20.19 (previously >=14)
  - **Sanity v2 compatibility removed**: The legacy `sanity.json`, `v2-incompatible.js`, and `@sanity/incompatible-plugin` shims are no longer shipped
  - **@sanity/ui v3**: The UI components now build against @sanity/ui v3 and the v2 theme API

## [1.2.3](https://github.com/sanity-io/sanity-plugin-shopify-assets/compare/v1.2.2...v1.2.3) (2025-12-29)

### Bug Fixes

- **deps:** allow studio v5 in peer deps ranges ([e4d1b40](https://github.com/sanity-io/sanity-plugin-shopify-assets/commit/e4d1b40dcb79db6a9e36f0096582ae9639c3cad2))

## [1.2.2](https://github.com/sanity-io/sanity-plugin-shopify-assets/compare/v1.2.1...v1.2.2) (2025-10-30)

### Bug Fixes

- add Bearer token authentication for improved reliability ([#19](https://github.com/sanity-io/sanity-plugin-shopify-assets/issues/19)) ([dc964be](https://github.com/sanity-io/sanity-plugin-shopify-assets/commit/dc964be843e4646c9c0c6a2e0edaaff04e4255aa))

## [1.2.1](https://github.com/sanity-io/sanity-plugin-shopify-assets/compare/v1.2.0...v1.2.1) (2025-07-10)

### Bug Fixes

- **deps:** allow studio v4 in peer dep ranges update-browserslist-db and typescript to latest ([#16](https://github.com/sanity-io/sanity-plugin-shopify-assets/issues/16)) ([5c3483f](https://github.com/sanity-io/sanity-plugin-shopify-assets/commit/5c3483f57625ca9c7c3eada1dd326ee8ead338df))

## [1.2.0](https://github.com/sanity-io/sanity-plugin-shopify-assets/compare/v1.1.0...v1.2.0) (2025-03-07)

### Features

- add react 19 to peer deps ([10070d3](https://github.com/sanity-io/sanity-plugin-shopify-assets/commit/10070d3052264cd26e2ee8c0ab84e43a30fe62a6))

## [1.1.0](https://github.com/sanity-io/sanity-plugin-shopify-assets/compare/v1.0.2...v1.1.0) (2023-03-02)

### Features

- strict schema support ([6ebc010](https://github.com/sanity-io/sanity-plugin-shopify-assets/commit/6ebc010f1eea557dc6a8af56ff04d1f2914c2a12))

## [1.0.2](https://github.com/sanity-io/sanity-plugin-shopify-assets/compare/v1.0.1...v1.0.2) (2023-02-08)

### Bug Fixes

- **chore:** fix api endpoint ([d38a393](https://github.com/sanity-io/sanity-plugin-shopify-assets/commit/d38a39320d7e78b1ff2e90d4fea75aa1b617f7bb))

## [1.0.1](https://github.com/sanity-io/sanity-plugin-shopify-assets/compare/v1.0.0...v1.0.1) (2023-01-19)

### Bug Fixes

- **chore:** correct dataset use ([7322db0](https://github.com/sanity-io/sanity-plugin-shopify-assets/commit/7322db00b6a6c475ec76a2c5992db023725c41d9))

## 1.0.0 (2023-01-16)

### Features

- initial release ([72f5b5b](https://github.com/sanity-io/sanity-plugin-shopify-assets/commit/72f5b5b840c6e0f8e11c717f5e63906a86e0d116))
- initial version of the input component ([5600767](https://github.com/sanity-io/sanity-plugin-shopify-assets/commit/56007674bdc27e722b3761d07ea2b9e111b2f23e))
- initial version of the input component ([a800be2](https://github.com/sanity-io/sanity-plugin-shopify-assets/commit/a800be2130038ab5ff43cc11dfce3324d57f9236))
