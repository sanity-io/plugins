# sanity-plugin-bynder-input

## 5.0.0

### Major Changes

- [#1553](https://github.com/sanity-io/plugins/pull/1553) [`387896a`](https://github.com/sanity-io/plugins/commit/387896ab86d98e224fc3591686c184da3ed64dfc) Thanks [@pedrobonamin](https://github.com/pedrobonamin)! - Fix the Bynder Compact View modal not appearing in Sanity Studio v6 (and blocking clicks after closing) by upgrading `@bynder/compact-view` to 5.4.0 and styling its modal container from the plugin.

  Breaking: `@bynder/compact-view` is now a regular dependency of the plugin instead of being patched and bundled into it, and it doesn't declare React 19 in its peer dependencies yet. Installing may require allowing the stale peer range — npm: `--legacy-peer-deps`, pnpm: `peerDependencyRules.allowedVersions` — see the README for details.

### Patch Changes

- [#1622](https://github.com/sanity-io/plugins/pull/1622) [`6fe3c11`](https://github.com/sanity-io/plugins/commit/6fe3c11e32b8187a19fbdc333e4a8b159fe5a616) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.9

## 4.1.7

### Patch Changes

- [#1596](https://github.com/sanity-io/plugins/pull/1596) [`f06fd76`](https://github.com/sanity-io/plugins/commit/f06fd767531740a09a5755f41fa1d3d42da202ae) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.8

## 4.1.6

### Patch Changes

- [#1571](https://github.com/sanity-io/plugins/pull/1571) [`52975b2`](https://github.com/sanity-io/plugins/commit/52975b2f0d4ea5086c800b2ce16190b862284a95) Thanks [@stipsan](https://github.com/stipsan)! - fix(deps): update tsdown to ^0.22.7 and @sanity/tsdown-config to ^0.14.0

## 4.1.5

### Patch Changes

- [#1519](https://github.com/sanity-io/plugins/pull/1519) [`a11d511`](https://github.com/sanity-io/plugins/commit/a11d511b371b332adc08197711583951eb294166) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.5

## 4.1.4

### Patch Changes

- [#1491](https://github.com/sanity-io/plugins/pull/1491) [`2361892`](https://github.com/sanity-io/plugins/commit/236189294b6408c9bced43765e53cf26a11a0e66) Thanks [@stipsan](https://github.com/stipsan)! - Build with `tsdown` instead of `@sanity/pkg-utils`. Internal build-tooling change only, with no intended changes to the public API or runtime behavior.

## 4.1.3

### Patch Changes

- [#1460](https://github.com/sanity-io/plugins/pull/1460) [`f50f060`](https://github.com/sanity-io/plugins/commit/f50f0605968e5cec4f23f5f3455abe5c8ddda23c) Thanks [@stipsan](https://github.com/stipsan)! - Regenerate TypeScript declaration output: `isolatedDeclarations` is no longer used and declarations are now generated with tsgo (`@typescript/native-preview`). Internal build-tooling change only, with no runtime behavior or public API changes.

## 4.1.2

### Patch Changes

- [#980](https://github.com/sanity-io/plugins/pull/980) [`98d148e`](https://github.com/sanity-io/plugins/commit/98d148e00ef679b422e1effe7fc53dfce9cb046c) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Update `@sanity/pkg-utils` to pick up a DTS generation bug fix.

## 4.1.1

### Patch Changes

- [#903](https://github.com/sanity-io/plugins/pull/903) [`2f03c8d`](https://github.com/sanity-io/plugins/commit/2f03c8d98039c29b9d4fd9bc6cd7c09c909c8cc4) Thanks [@bjoerge](https://github.com/bjoerge)! - Widen `sanity` peer-dependency range to `^5 || ^6.0.0-0` to support Sanity Studio v6 (including v6 pre-releases).

## 4.1.0

### Minor Changes

- [#889](https://github.com/sanity-io/plugins/pull/889) [`be9fc64`](https://github.com/sanity-io/plugins/commit/be9fc64b996e10abff53f94947ac0d19d554cd8a) Thanks [@estreske](https://github.com/estreske)! - Add `persistRawFields` option to opt out of persisting the full raw Bynder asset payload. Available both on `bynderInputPlugin({...})` as a Studio-wide default and on a `bynder.asset` field's `options` as a per-field override. Defaults to `true` so existing documents and behavior are unchanged.

## 4.0.4

### Patch Changes

- [`6397826`](https://github.com/sanity-io/plugins/commit/63978265fe5b46ea88b524a945d16fbf39d7c199) Thanks [@stipsan](https://github.com/stipsan)! - Improve build output and dts gen

## 4.0.3

### Patch Changes

- [`d3978bc`](https://github.com/sanity-io/plugins/commit/d3978bc676286c86396d29e02b744474b3340bee) Thanks [@stipsan](https://github.com/stipsan)! - Update LICENSE year

## 4.0.2

### Patch Changes

- [`61bd460`](https://github.com/sanity-io/plugins/commit/61bd46026d73147b9f8a51a82fba186927327c4e) Thanks [@stipsan](https://github.com/stipsan)! - Improve dts output

## 4.0.1

### Patch Changes

- [`764cf28`](https://github.com/sanity-io/plugins/commit/764cf281176986d009e7ec8d32e5fa050ca20edb) Thanks [@stipsan](https://github.com/stipsan)! - Remove `react-compiler-runtime` dep

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
