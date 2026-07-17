# @sanity/cross-dataset-duplicator

## 2.0.9

### Patch Changes

- [#1596](https://github.com/sanity-io/plugins/pull/1596) [`f06fd76`](https://github.com/sanity-io/plugins/commit/f06fd767531740a09a5755f41fa1d3d42da202ae) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.8

- Updated dependencies [[`f06fd76`](https://github.com/sanity-io/plugins/commit/f06fd767531740a09a5755f41fa1d3d42da202ae)]:
  - @sanity/studio-secrets@4.0.11

## 2.0.8

### Patch Changes

- [#1571](https://github.com/sanity-io/plugins/pull/1571) [`52975b2`](https://github.com/sanity-io/plugins/commit/52975b2f0d4ea5086c800b2ce16190b862284a95) Thanks [@stipsan](https://github.com/stipsan)! - fix(deps): update tsdown to ^0.22.7 and @sanity/tsdown-config to ^0.14.0

- Updated dependencies [[`52975b2`](https://github.com/sanity-io/plugins/commit/52975b2f0d4ea5086c800b2ce16190b862284a95)]:
  - @sanity/studio-secrets@4.0.10

## 2.0.7

### Patch Changes

- [#1519](https://github.com/sanity-io/plugins/pull/1519) [`a11d511`](https://github.com/sanity-io/plugins/commit/a11d511b371b332adc08197711583951eb294166) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.5

- Updated dependencies [[`a11d511`](https://github.com/sanity-io/plugins/commit/a11d511b371b332adc08197711583951eb294166)]:
  - @sanity/studio-secrets@4.0.9

## 2.0.6

### Patch Changes

- Updated dependencies [[`1a6465d`](https://github.com/sanity-io/plugins/commit/1a6465d2548e8fe8b034f58b89a905a6ad74bd3a)]:
  - @sanity/studio-secrets@4.0.8

## 2.0.5

### Patch Changes

- [#1491](https://github.com/sanity-io/plugins/pull/1491) [`2361892`](https://github.com/sanity-io/plugins/commit/236189294b6408c9bced43765e53cf26a11a0e66) Thanks [@stipsan](https://github.com/stipsan)! - Build with `tsdown` instead of `@sanity/pkg-utils`. Internal build-tooling change only, with no intended changes to the public API or runtime behavior.

- Updated dependencies [[`2361892`](https://github.com/sanity-io/plugins/commit/236189294b6408c9bced43765e53cf26a11a0e66)]:
  - @sanity/studio-secrets@4.0.7

## 2.0.4

### Patch Changes

- [#1460](https://github.com/sanity-io/plugins/pull/1460) [`f50f060`](https://github.com/sanity-io/plugins/commit/f50f0605968e5cec4f23f5f3455abe5c8ddda23c) Thanks [@stipsan](https://github.com/stipsan)! - Regenerate TypeScript declaration output: `isolatedDeclarations` is no longer used and declarations are now generated with tsgo (`@typescript/native-preview`). Internal build-tooling change only, with no runtime behavior or public API changes.

- Updated dependencies [[`f50f060`](https://github.com/sanity-io/plugins/commit/f50f0605968e5cec4f23f5f3455abe5c8ddda23c)]:
  - @sanity/studio-secrets@4.0.6

## 2.0.3

### Patch Changes

- [#1481](https://github.com/sanity-io/plugins/pull/1481) [`0eae652`](https://github.com/sanity-io/plugins/commit/0eae652abea74fd63af2d334707afc8ecd4eb15a) Thanks [@stipsan](https://github.com/stipsan)! - Upgrade `@sanity/pkg-utils` to `^10.9.0`, enabling tree-shaking of unused `styled-components` in the published bundle. Tagged template literals are now transpiled to plain call expressions during build, so bundlers can drop styled components this plugin exports but the app doesn't use, reducing bundle size.

## 2.0.2

### Patch Changes

- [#1471](https://github.com/sanity-io/plugins/pull/1471) [`52487d2`](https://github.com/sanity-io/plugins/commit/52487d208f11fe2a4ccb523fab9386f3fbdd5880) Thanks [@stipsan](https://github.com/stipsan)! - Update `@sanity/icons` to v4 and adopt its per-icon import paths for smaller bundles and faster treeshaking

## 2.0.1

### Patch Changes

- [#1311](https://github.com/sanity-io/plugins/pull/1311) [`f2b7f4d`](https://github.com/sanity-io/plugins/commit/f2b7f4d3647a73d353faf6015955c6b921e1aed2) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency dset to ^3.1.4

## 2.0.0

### Major Changes

- [#974](https://github.com/sanity-io/plugins/pull/974) [`5aefe51`](https://github.com/sanity-io/plugins/commit/5aefe51e363964f6dd321dca3f48083993d06bde) Thanks [@SimeonGriggs](https://github.com/SimeonGriggs), [@lukejacksonn](https://github.com/lukejacksonn), [@stipsan](https://github.com/stipsan), [@fernandolucchesi](https://github.com/fernandolucchesi), [@iJackWilson](https://github.com/iJackWilson), [@jjburbridge](https://github.com/jjburbridge), [@KJHeartbreaker](https://github.com/KJHeartbreaker), [@randhi-tnf](https://github.com/randhi-tnf), [@wkentdag](https://github.com/wkentdag)! - Port @sanity/cross-dataset-duplicator to the Sanity plugins monorepo

  This major release includes several breaking changes as part of the migration to the monorepo:

  - **React Compiler enabled**: The package is now built with React Compiler targeting React 19
  - **ESM-only**: CommonJS support has been removed. The package now ships only ESM
  - **React 19.2+ required**: Minimum React version is now 19.2 (previously ^18.3 || ^19)
  - **react-dom 19.2+ required**: Minimum react-dom version is now 19.2 (previously ^18.3 || ^19)
  - **Sanity Studio v5+ required**: Minimum Sanity version is now v5 (Sanity v3 and v4 are no longer supported)
  - **Node.js 20.19+ required**: Minimum Node.js version is now 20.19 (previously >=18)

  Other notable changes:

  - Migrated to the @sanity/ui v2/v3 APIs (`gap` instead of `space`, `gridTemplateColumns` instead of `columns`, v2 theme API for dark mode detection)
  - Fixed a bug in reference gathering where only the first new document `_id` was tracked as visited, which could cause redundant recursive queries
  - Removed the `async` dependency in favor of a native concurrency-limited implementation

## [1.5.1](https://github.com/sanity-io/cross-dataset-duplicator/compare/v1.5.0...v1.5.1) (2025-12-29)

### Bug Fixes

- **deps:** allow studio v5 in peer deps ranges ([#60](https://github.com/sanity-io/cross-dataset-duplicator/issues/60)) ([3abc569](https://github.com/sanity-io/cross-dataset-duplicator/commit/3abc569e4495c728c8dddcbc1a8a503a41f95977))

## [1.5.0](https://github.com/sanity-io/cross-dataset-duplicator/compare/v1.4.2...v1.5.0) (2025-07-10)

### Features

- allow studio v4, bump ui deps to v2, allow react 19 ([f5b86a2](https://github.com/sanity-io/cross-dataset-duplicator/commit/f5b86a299551e61248923f9a23172f8e9dce387b))

## [1.4.2](https://github.com/sanity-io/cross-dataset-duplicator/compare/v1.4.1...v1.4.2) (2025-05-23)

### Bug Fixes

- configurable apiVersion ([#59](https://github.com/sanity-io/cross-dataset-duplicator/issues/59)) ([e38eddd](https://github.com/sanity-io/cross-dataset-duplicator/commit/e38edddb92fcaeba8e20c3fb4539ffdcff4628fb))

## [1.4.1](https://github.com/sanity-io/cross-dataset-duplicator/compare/v1.4.0...v1.4.1) (2025-01-03)

### Bug Fixes

- multiproject disabled, add check for projectId ([#55](https://github.com/sanity-io/cross-dataset-duplicator/issues/55)) ([bf6e6ba](https://github.com/sanity-io/cross-dataset-duplicator/commit/bf6e6ba2d15a099d1198a2f30eba4335ff5ce0f8))

## [1.4.0](https://github.com/sanity-io/cross-dataset-duplicator/compare/v1.3.0...v1.4.0) (2024-11-21)

### Features

- pre defined queires in config, ui tweaks ([e102993](https://github.com/sanity-io/cross-dataset-duplicator/commit/e102993a016b5b5b8a3c0a9c945f10e266c495ff))

## [1.3.0](https://github.com/sanity-io/cross-dataset-duplicator/compare/v1.2.4...v1.3.0) (2024-01-23)

### Features

- fix dependencies, ui tweaks, readme update ([#42](https://github.com/sanity-io/cross-dataset-duplicator/issues/42)) ([a1274a5](https://github.com/sanity-io/cross-dataset-duplicator/commit/a1274a5a53fea3ad2ab859f8f4203cb712ad933b))

## [1.2.4](https://github.com/sanity-io/cross-dataset-duplicator/compare/v1.2.3...v1.2.4) (2024-01-02)

### Bug Fixes

- use new 'url' and 'path' keys when uploading assets ([#39](https://github.com/sanity-io/cross-dataset-duplicator/issues/39)) ([6b52a5a](https://github.com/sanity-io/cross-dataset-duplicator/commit/6b52a5a20981449918095d1c88fd6ce965bd0383))

## [1.2.3](https://github.com/sanity-io/cross-dataset-duplicator/compare/v1.2.2...v1.2.3) (2023-11-02)

### Bug Fixes

- update semantic release ([#38](https://github.com/sanity-io/cross-dataset-duplicator/issues/38)) ([ba23802](https://github.com/sanity-io/cross-dataset-duplicator/commit/ba23802f438a150664c3e7f26d2c2d3e91d75ad7))

## [1.2.2](https://github.com/sanity-io/cross-dataset-duplicator/compare/v1.2.1...v1.2.2) (2023-11-02)

### Bug Fixes

- add node exports ([#36](https://github.com/sanity-io/cross-dataset-duplicator/issues/36)) ([f5a0cac](https://github.com/sanity-io/cross-dataset-duplicator/commit/f5a0cac06f89e0c40e542f8b151a8ec6ea37f253))
- update semantic release ([#37](https://github.com/sanity-io/cross-dataset-duplicator/issues/37)) ([7e451b5](https://github.com/sanity-io/cross-dataset-duplicator/commit/7e451b52e7a08587d9751abc7d9a1e6a1a2187ef))

## [1.2.1](https://github.com/sanity-io/cross-dataset-duplicator/compare/v1.2.0...v1.2.1) (2023-09-06)

### Bug Fixes

- add asset metadata document to transaction ([#34](https://github.com/sanity-io/cross-dataset-duplicator/issues/34)) ([f9728e1](https://github.com/sanity-io/cross-dataset-duplicator/commit/f9728e138c3614a33a2ed6531cd0bd82e4ffae9e))

## [1.2.0](https://github.com/sanity-io/cross-dataset-duplicator/compare/v1.1.0...v1.2.0) (2023-04-27)

### Features

- **DocumentAction:** add `onDuplicated` prop ([#30](https://github.com/sanity-io/cross-dataset-duplicator/issues/30)) ([f553aca](https://github.com/sanity-io/cross-dataset-duplicator/commit/f553aca7ef35e2ec54f2f62e7f9e46c9067f6e29))

### Bug Fixes

- update useClient to use api, remove React default imports ([#31](https://github.com/sanity-io/cross-dataset-duplicator/issues/31)) ([f81c7c0](https://github.com/sanity-io/cross-dataset-duplicator/commit/f81c7c0eb48e67f9a840a83f96075716dd8f60df))

## [1.1.0](https://github.com/sanity-io/cross-dataset-duplicator/compare/v1.0.0...v1.1.0) (2023-03-31)

### Features

- add migration component to exports ([1019151](https://github.com/sanity-io/cross-dataset-duplicator/commit/10191513643a22f02d0517c009a7b5084eb030d0))
- export Document Action and Config Provider ([8e4c82a](https://github.com/sanity-io/cross-dataset-duplicator/commit/8e4c82a388e49c4da47c8908c898cb514325cdda))

### Bug Fixes

- give action an identifier ([896b9fa](https://github.com/sanity-io/cross-dataset-duplicator/commit/896b9fa2f3cbcfc207732cacb0255bc1534ad913))
- import comments ([33a2eb8](https://github.com/sanity-io/cross-dataset-duplicator/commit/33a2eb8a64d093eae9e9719d457c1d81b704a100))
- tsdoc errors ([876dbc0](https://github.com/sanity-io/cross-dataset-duplicator/commit/876dbc00c46c21d15992651af6760177f04acb99))
- tsdoc errors ([52d34da](https://github.com/sanity-io/cross-dataset-duplicator/commit/52d34da5f9bcbce79595c0c24d79935a98fddc27))
- tsdoc errors ([16acc2d](https://github.com/sanity-io/cross-dataset-duplicator/commit/16acc2d2f39434b8aa9a854dfcc038e2e3a7af0c))

## 1.0.0 (2022-12-14)

### Features

- plugin kit, v3 compat, satisfy types ([179d68f](https://github.com/sanity-io/cross-dataset-duplicator/commit/179d68fe6cc1cb23a993407e5e3266b798c89143))
- prepare for release ([7e06c42](https://github.com/sanity-io/cross-dataset-duplicator/commit/7e06c42e0735179ea43117ac797df2aa3625f63b))

### Bug Fixes

- lint ([afde566](https://github.com/sanity-io/cross-dataset-duplicator/commit/afde566b988a56ce6f3a2a287db4544f08dd91d8))
- test build of plugin ([f404100](https://github.com/sanity-io/cross-dataset-duplicator/commit/f404100d9f11ea235b634f079985e972b2936dac))
- update readme ([72e9df3](https://github.com/sanity-io/cross-dataset-duplicator/commit/72e9df322c392f61b6a417f8a81ab94bc29d5fb5))
- update readme, improve inbound/outbound ([f2d5ba4](https://github.com/sanity-io/cross-dataset-duplicator/commit/f2d5ba490af3f48837da74529a967e444fbafdc2))
