# sanity-plugin-cloudinary

## 2.0.12

### Patch Changes

- [#1571](https://github.com/sanity-io/plugins/pull/1571) [`52975b2`](https://github.com/sanity-io/plugins/commit/52975b2f0d4ea5086c800b2ce16190b862284a95) Thanks [@stipsan](https://github.com/stipsan)! - fix(deps): update tsdown to ^0.22.7 and @sanity/tsdown-config to ^0.14.0

- Updated dependencies [[`52975b2`](https://github.com/sanity-io/plugins/commit/52975b2f0d4ea5086c800b2ce16190b862284a95)]:
  - @sanity/studio-secrets@4.0.10

## 2.0.11

### Patch Changes

- [#1519](https://github.com/sanity-io/plugins/pull/1519) [`a11d511`](https://github.com/sanity-io/plugins/commit/a11d511b371b332adc08197711583951eb294166) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.5

- Updated dependencies [[`a11d511`](https://github.com/sanity-io/plugins/commit/a11d511b371b332adc08197711583951eb294166)]:
  - @sanity/studio-secrets@4.0.9

## 2.0.10

### Patch Changes

- Updated dependencies [[`1a6465d`](https://github.com/sanity-io/plugins/commit/1a6465d2548e8fe8b034f58b89a905a6ad74bd3a)]:
  - @sanity/studio-secrets@4.0.8

## 2.0.9

### Patch Changes

- [#1476](https://github.com/sanity-io/plugins/pull/1476) [`b8bc962`](https://github.com/sanity-io/plugins/commit/b8bc96275b26a3d219a55cd22e3d29b27e331e11) Thanks [@stipsan](https://github.com/stipsan)! - Document intentional use of the asset source `title` property (internal change only)

## 2.0.8

### Patch Changes

- [#1491](https://github.com/sanity-io/plugins/pull/1491) [`2361892`](https://github.com/sanity-io/plugins/commit/236189294b6408c9bced43765e53cf26a11a0e66) Thanks [@stipsan](https://github.com/stipsan)! - Build with `tsdown` instead of `@sanity/pkg-utils`. Internal build-tooling change only, with no intended changes to the public API or runtime behavior.

- Updated dependencies [[`2361892`](https://github.com/sanity-io/plugins/commit/236189294b6408c9bced43765e53cf26a11a0e66)]:
  - @sanity/studio-secrets@4.0.7

## 2.0.7

### Patch Changes

- [#1460](https://github.com/sanity-io/plugins/pull/1460) [`f50f060`](https://github.com/sanity-io/plugins/commit/f50f0605968e5cec4f23f5f3455abe5c8ddda23c) Thanks [@stipsan](https://github.com/stipsan)! - Regenerate TypeScript declaration output: `isolatedDeclarations` is no longer used and declarations are now generated with tsgo (`@typescript/native-preview`). Internal build-tooling change only, with no runtime behavior or public API changes.

- Updated dependencies [[`f50f060`](https://github.com/sanity-io/plugins/commit/f50f0605968e5cec4f23f5f3455abe5c8ddda23c)]:
  - @sanity/studio-secrets@4.0.6

## 2.0.6

### Patch Changes

- [#1481](https://github.com/sanity-io/plugins/pull/1481) [`0eae652`](https://github.com/sanity-io/plugins/commit/0eae652abea74fd63af2d334707afc8ecd4eb15a) Thanks [@stipsan](https://github.com/stipsan)! - Upgrade `@sanity/pkg-utils` to `^10.9.0`, enabling tree-shaking of unused `styled-components` in the published bundle. Tagged template literals are now transpiled to plain call expressions during build, so bundlers can drop styled components this plugin exports but the app doesn't use, reducing bundle size.

## 2.0.5

### Patch Changes

- [#1471](https://github.com/sanity-io/plugins/pull/1471) [`52487d2`](https://github.com/sanity-io/plugins/commit/52487d208f11fe2a4ccb523fab9386f3fbdd5880) Thanks [@stipsan](https://github.com/stipsan)! - Update `@sanity/icons` to v4 and adopt its per-icon import paths for smaller bundles and faster treeshaking

## 2.0.4

### Patch Changes

- [#1432](https://github.com/sanity-io/plugins/pull/1432) [`3575908`](https://github.com/sanity-io/plugins/commit/3575908bed86a22f435d4fb22442af95be9e6e29) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency nanoid to ^5.1.16

## 2.0.3

### Patch Changes

- [#1400](https://github.com/sanity-io/plugins/pull/1400) [`169782e`](https://github.com/sanity-io/plugins/commit/169782e2f6fc6b91ab6c7efaae197a65b6a55640) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency nanoid to ^5.1.15

## 2.0.2

### Patch Changes

- [#1383](https://github.com/sanity-io/plugins/pull/1383) [`e4231ba`](https://github.com/sanity-io/plugins/commit/e4231bad0ca3ac4e1be0027aeaf55140d07269b8) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency nanoid to v5

## 2.0.1

### Patch Changes

- [#1217](https://github.com/sanity-io/plugins/pull/1217) [`a0493e8`](https://github.com/sanity-io/plugins/commit/a0493e86e91ce93749c0a58d93b0ecab8f4a0468) Thanks [@antonio-lopez](https://github.com/antonio-lopez)! - Fix typos in README asset source example comments

## 2.0.0

### Major Changes

- [#970](https://github.com/sanity-io/plugins/pull/970) [`5d42c4c`](https://github.com/sanity-io/plugins/commit/5d42c4ccdd3f7d8e9ed04b607d3d1cad71625ee2) Thanks [@runeb](https://github.com/runeb), [@snorrees](https://github.com/snorrees), [@stipsan](https://github.com/stipsan), [@SimeonGriggs](https://github.com/SimeonGriggs), [@binoy14](https://github.com/binoy14), [@azaxarov](https://github.com/azaxarov), [@pedrobonamin](https://github.com/pedrobonamin), [@ninaandal](https://github.com/ninaandal), [@jasonb194](https://github.com/jasonb194), [@ankitkandari](https://github.com/ankitkandari)! - Port sanity-plugin-cloudinary to the Sanity plugins monorepo

  This major release includes several breaking changes as part of the migration to the monorepo:

  - **React Compiler enabled**: The package is now built with React Compiler targeting React 19
  - **ESM-only**: CommonJS support has been removed. The package now ships only ESM
  - **React 19.2+ required**: Minimum React version is now 19.2 (previously ^18.3 || ^19)
  - **react-dom 19.2+ required**: Minimum react-dom version is now 19.2 (previously ^18.3 || ^19)
  - **styled-components 6.1+ required**: Minimum styled-components version is now 6.1 (previously ^6.0)
  - **Sanity Studio v5+ required**: Minimum Sanity version is now v5 (Sanity v3 and v4 are no longer supported)
  - **Node.js 20.19+ required**: Minimum Node.js version is now 20.19 (previously >=14)

## [1.4.1](https://github.com/sanity-io/sanity-plugin-cloudinary/compare/v1.4.0...v1.4.1) (2025-12-18)

### Bug Fixes

- **deps:** make peer dependencies include sanity 5.x ([#94](https://github.com/sanity-io/sanity-plugin-cloudinary/issues/94)) ([d4a7765](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/d4a77654514ef14ea920b23e6ead9a8e59efc23c))

## [1.4.0](https://github.com/sanity-io/sanity-plugin-cloudinary/compare/v1.3.1...v1.4.0) (2025-09-03)

### Features

- Handle Null Values and Anon Objects for Copy/Paste ([0e8759e](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/0e8759e9eeac634b5e251ee06b7ce690d0e91598))

### Bug Fixes

- update readme ([ac4fd8f](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/ac4fd8f54c9d3d6e0737b6897d49c4142a5028b8))

## [1.3.1](https://github.com/sanity-io/sanity-plugin-cloudinary/compare/v1.3.0...v1.3.1) (2025-07-10)

### Bug Fixes

- **deps:** allow studio v4 peer dep ranges ([7586517](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/7586517ee6d5c9e5a736c4dec5d43f2361512377))

## [1.3.0](https://github.com/sanity-io/sanity-plugin-cloudinary/compare/v1.2.0...v1.3.0) (2025-04-16)

### Features

- pdf and raw resource_type preview ([339bc56](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/339bc563f1d51c66b3a6e42fd60bc4d69d95f301))

## [1.2.0](https://github.com/sanity-io/sanity-plugin-cloudinary/compare/v1.1.5...v1.2.0) (2025-03-07)

### Features

- add react 19 support ([8e01cdd](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/8e01cddba570bb5b67f4e7f6e8b221ce40bc76bd))

## [1.1.5](https://github.com/sanity-io/sanity-plugin-cloudinary/compare/v1.1.4...v1.1.5) (2024-11-26)

### Bug Fixes

- [#74](https://github.com/sanity-io/sanity-plugin-cloudinary/issues/74) upgrade '@sanity/studio-secrets' and '@sanity/ui' to latest versions ([#78](https://github.com/sanity-io/sanity-plugin-cloudinary/issues/78)) ([c71435a](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/c71435a544bd9d4019544c283c7c874b0b7bb3d1))

## [1.1.4](https://github.com/sanity-io/sanity-plugin-cloudinary/compare/v1.1.3...v1.1.4) (2024-10-16)

### Bug Fixes

- use 'dialogHeaderTitle' prop ([#77](https://github.com/sanity-io/sanity-plugin-cloudinary/issues/77)) ([b770cb2](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/b770cb2777244f9cb68d02127446093b43ee414e))

## [1.1.3](https://github.com/sanity-io/sanity-plugin-cloudinary/compare/v1.1.2...v1.1.3) (2024-05-30)

### Bug Fixes

- transform cloudinary metadata to no special characters ([#73](https://github.com/sanity-io/sanity-plugin-cloudinary/issues/73)) ([f75e729](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/f75e72973cf4f7e3a0379fb7825dc39282394dc8))

## [1.1.2](https://github.com/sanity-io/sanity-plugin-cloudinary/compare/v1.1.1...v1.1.2) (2024-02-05)

### Bug Fixes

- **deps:** update dependencies (non-major) ([#25](https://github.com/sanity-io/sanity-plugin-cloudinary/issues/25)) ([3a30053](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/3a30053d5fa999c85aaa95861e4e3213567341ac))
- **deps:** update dependency nanoid to v4 ([#26](https://github.com/sanity-io/sanity-plugin-cloudinary/issues/26)) ([91aaf21](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/91aaf21c77b6fbb0494b353daa985da2a80d4312))
- fixes styled-components dependency causing plugin to crash ([#67](https://github.com/sanity-io/sanity-plugin-cloudinary/issues/67)) ([f4c245b](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/f4c245b2135530b5978b38865654b90d2eb82e3d))

## [1.1.1](https://github.com/sanity-io/sanity-plugin-cloudinary/compare/v1.1.0...v1.1.1) (2023-03-08)

### Bug Fixes

- restored "add multiple" support for arrays with cloudinary.assets ([91cf56a](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/91cf56a30e9c02560ee2d86eabe0aba8454aa829))

## [1.1.0](https://github.com/sanity-io/sanity-plugin-cloudinary/compare/v1.0.2...v1.1.0) (2023-03-01)

### Features

- context is now part of the schema (but not exposed in ui) ([31bf342](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/31bf3421308cbddd0bec523d02262f1ef1ee2b71))

## [1.0.2](https://github.com/sanity-io/sanity-plugin-cloudinary/compare/v1.0.1...v1.0.2) (2023-02-20)

### Bug Fixes

- fix video player and preview ([98357a2](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/98357a2630d0a33da28edc842118ab4aed247509))

## [1.0.1](https://github.com/sanity-io/sanity-plugin-cloudinary/compare/v1.0.0...v1.0.1) (2022-11-25)

### Bug Fixes

- **deps:** sanity ^3.0.0 (rc.3 compatible) ([0ff26b3](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/0ff26b3a600527668cf95079e18c9d264f7ad3c5))

## 1.0.0 (2022-11-15)

### ⚠ BREAKING CHANGES

- this version does not work in Sanity Studio V2

### Features

- initial sanity V3 release ([43d5f7a](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/43d5f7ac33f2a668aa4ad56594f047f1caebcee8))
- initial v3 version ([8e45096](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/8e45096cc039b3a36269ce193c18027f7b45cd0e))

### Bug Fixes

- callbacks in CloudinaryAssetSource should no longer be stale ([40e671e](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/40e671e6beb3ab98cf7622c1eeaf722d092eea2c))
- compiled for sanity 3.0.0-rc.0 ([45fcfc6](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/45fcfc675836e732caca58b9c03c29c5cba447f7))
- create array if not already existing, before adding items. Fixes [#1](https://github.com/sanity-io/sanity-plugin-cloudinary/issues/1) ([93c0874](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/93c08747a356e094bdd75ab15b22877a0bbdfecc))
- **deps:** @sanity/secrets -> @sanity/studio-secrets ([3f4b105](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/3f4b105ae18d1e4741309e4740c3fc2e3e26646e))
- **deps:** pkg-utils & @sanity/plugin-kit ([9671271](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/96712711d406fe5a245cee572e2b499e40c6ac17))
- make sure we keep \_key properties ([c5454ec](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/c5454ece76716a8d3745f7472866e40575aab3ff))
- **release:** initial v3 npm version ([f565046](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/f5650464194f303f3a5e65276b14e6b7f99560e1))
- remove styling ([f409c59](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/f409c59c1177e77dc641562c374121681a49f930))

## [1.0.0-v3-studio.4](https://github.com/sanity-io/sanity-plugin-cloudinary/compare/v1.0.0-v3-studio.3...v1.0.0-v3-studio.4) (2022-11-04)

### Bug Fixes

- **deps:** pkg-utils & @sanity/plugin-kit ([9671271](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/96712711d406fe5a245cee572e2b499e40c6ac17))

## [1.0.0-v3-studio.3](https://github.com/sanity-io/sanity-plugin-cloudinary/compare/v1.0.0-v3-studio.2...v1.0.0-v3-studio.3) (2022-11-03)

### Bug Fixes

- compiled for sanity 3.0.0-rc.0 ([45fcfc6](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/45fcfc675836e732caca58b9c03c29c5cba447f7))

## [1.0.0-v3-studio.2](https://github.com/sanity-io/sanity-plugin-cloudinary/compare/v1.0.0-v3-studio.1...v1.0.0-v3-studio.2) (2022-10-31)

### Bug Fixes

- **release:** initial v3 npm version ([f565046](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/f5650464194f303f3a5e65276b14e6b7f99560e1))

## 1.0.0-v3-studio.1 (2022-10-31)

### Features

- initial v3 version ([8e45096](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/8e45096cc039b3a36269ce193c18027f7b45cd0e))

### Bug Fixes

- callbacks in CloudinaryAssetSource should no longer be stale ([40e671e](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/40e671e6beb3ab98cf7622c1eeaf722d092eea2c))
- create array if not already existing, before adding items. Fixes [#1](https://github.com/sanity-io/sanity-plugin-cloudinary/issues/1) ([93c0874](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/93c08747a356e094bdd75ab15b22877a0bbdfecc))
- **deps:** @sanity/secrets -> @sanity/studio-secrets ([3f4b105](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/3f4b105ae18d1e4741309e4740c3fc2e3e26646e))
- make sure we keep \_key properties ([c5454ec](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/c5454ece76716a8d3745f7472866e40575aab3ff))
- remove styling ([f409c59](https://github.com/sanity-io/sanity-plugin-cloudinary/commit/f409c59c1177e77dc641562c374121681a49f930))
