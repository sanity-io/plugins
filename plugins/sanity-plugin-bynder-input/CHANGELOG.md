# sanity-plugin-bynder-input

## 4.0.0

### Major Changes

- [`20c43ac`](https://github.com/sanity-io/plugins/commit/20c43ac07e632ce5d75fd8bd9a47938e377b476b) Thanks [@stipsan](https://github.com/stipsan)! - Require Sanity Studio V5

## 3.0.5

### Patch Changes

- [`7074855`](https://github.com/sanity-io/plugins/commit/7074855ecf139da7d7952963a12589a8f464bd0f) Thanks [@stipsan](https://github.com/stipsan)! - Fix linter issues

## 3.0.4

### Patch Changes

- [`69a8d2f`](https://github.com/sanity-io/plugins/commit/69a8d2f8ce1e8f5b342e7066dbc79a20b6687abe) Thanks [@stipsan](https://github.com/stipsan)! - Declare support for Studio v5

## 3.0.3

### Patch Changes

- [#182](https://github.com/sanity-io/plugins/pull/182) [`1a1713c`](https://github.com/sanity-io/plugins/commit/1a1713ccdc11db31a4e442359f14df529ffc9201) Thanks [@phettler](https://github.com/phettler)! - Enhance BynderInput component with improved asset handling and preview options based on issue 149
  - Added support for field-level options in Bynder asset configuration.
  - Updated asset handling to safely access nested properties.
  - Improved media data structure for backward compatibility.
  - Adjusted image preview styling and added support for document types.
  - Refactored button text based on asset presence.

## 3.0.2

### Patch Changes

- [#151](https://github.com/sanity-io/plugins/pull/151) [`e100889`](https://github.com/sanity-io/plugins/commit/e1008891c8f9dd694631e3c9f977197da13de9ad) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): Update dependency video.js to ^7.21.7

## 3.0.1

### Patch Changes

- [`637b578`](https://github.com/sanity-io/plugins/commit/637b5789359c334b59a48c8b050b00fc73759b6f) Thanks [@stipsan](https://github.com/stipsan)! - Lazy load the video player

## 3.0.0

### Major Changes

- [#144](https://github.com/sanity-io/plugins/pull/144) [`fd5eb7d`](https://github.com/sanity-io/plugins/commit/fd5eb7df38ae2a9aa49654dcd11b298207f59718) Thanks [@stipsan](https://github.com/stipsan)! - Updates Bynder Compact View from 3.x.x to 5.1.1
  This will introduce a [number of improvements](https://developer-docs.bynder.com/ui-components#history) and features for the plugin.
  Secondly, it migrates from CDN script installation to an npm package, which will eliminate the risks associated with it. And on top of that

  Update required a breaking change in the API of the plugin.

  From the plugin perspective, migration should be straightforward; however, there is also a breaking change in the UCV regarding `AssetFilterJson`, so it might require more attention.

  Thank you @Shastel!

- [#144](https://github.com/sanity-io/plugins/pull/144) [`fd5eb7d`](https://github.com/sanity-io/plugins/commit/fd5eb7df38ae2a9aa49654dcd11b298207f59718) Thanks [@stipsan](https://github.com/stipsan)! - Requires Sanity Studio v4, removes CJS export, adds support for React 19, uses React Compiler to optimize components, moved to plugins monorepo

### Minor Changes

- [#144](https://github.com/sanity-io/plugins/pull/144) [`fd5eb7d`](https://github.com/sanity-io/plugins/commit/fd5eb7df38ae2a9aa49654dcd11b298207f59718) Thanks [@stipsan](https://github.com/stipsan)! - Updated from `@sanity/ui` v1 to v3

### Patch Changes

- [`46526ed`](https://github.com/sanity-io/plugins/commit/46526ed53b09ca1f1f96fe30749657572588f613) Thanks [@stipsan](https://github.com/stipsan)! - Removed `@sanity/incompatible-plugin` dependency

- [#144](https://github.com/sanity-io/plugins/pull/144) [`fd5eb7d`](https://github.com/sanity-io/plugins/commit/fd5eb7df38ae2a9aa49654dcd11b298207f59718) Thanks [@stipsan](https://github.com/stipsan)! - Improved lazy loading

## [2.3.1](https://github.com/sanity-io/sanity-plugin-bynder-input/compare/v2.3.0...v2.3.1) (2025-07-10)

### Bug Fixes

- **deps:** allow studio v4 in peer dep ranges + update main.yml ([#29](https://github.com/sanity-io/sanity-plugin-bynder-input/issues/29)) ([fa463c0](https://github.com/sanity-io/sanity-plugin-bynder-input/commit/fa463c0e56570be7ad0cb63405c5a87051873d03))

## [2.3.0](https://github.com/sanity-io/sanity-plugin-bynder-input/compare/v2.2.0...v2.3.0) (2025-06-10)

### Features

- support selectedFile.url for DAT & Derivatives ([e064909](https://github.com/sanity-io/sanity-plugin-bynder-input/commit/e064909b75836ba0e853b93b811388b8f165534b))

## [2.2.0](https://github.com/sanity-io/sanity-plugin-bynder-input/compare/v2.1.0...v2.2.0) (2025-03-21)

### Features

- adds width and height to schema definition ([84d54ac](https://github.com/sanity-io/sanity-plugin-bynder-input/commit/84d54acd0eccbfc73a56738233d91a2f7d09f4c5))
- pass the asset dimensions down to the sanity object ([6fe3a1c](https://github.com/sanity-io/sanity-plugin-bynder-input/commit/6fe3a1c83125f5a00c64fabcf20b4b92d162ea78))

## [2.1.0](https://github.com/sanity-io/sanity-plugin-bynder-input/compare/v2.0.1...v2.1.0) (2024-09-30)

### Features

- **configuration:** adds support for assetFilter option ([#17](https://github.com/sanity-io/sanity-plugin-bynder-input/issues/17)) ([9726a4b](https://github.com/sanity-io/sanity-plugin-bynder-input/commit/9726a4b6e844588b19ba82aefd8f0437e2e618d9))

## [2.0.1](https://github.com/sanity-io/sanity-plugin-bynder-input/compare/v2.0.0...v2.0.1) (2022-12-21)

### Bug Fixes

- **docs:** install command ([fa36b94](https://github.com/sanity-io/sanity-plugin-bynder-input/commit/fa36b94c2b136db64acb0162674c92bffb054063))

## [2.0.0](https://github.com/sanity-io/sanity-plugin-bynder-input/compare/v1.4.0...v2.0.0) (2022-12-21)

### ⚠ BREAKING CHANGES

- this version does not work in Sanity Studio v2

### Features

- initial Sanity Studio v3 version ([ebd5e15](https://github.com/sanity-io/sanity-plugin-bynder-input/commit/ebd5e150a4a5b2bcd2f63a1e5e001e7ab3f41788))

### Bug Fixes

- improved typings, diff component and readme ([f73d82a](https://github.com/sanity-io/sanity-plugin-bynder-input/commit/f73d82ab43b18d5503bba8c0ae24cef39d129005))
