# @sanity/sanity-plugin-async-list

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

- [#1083](https://github.com/sanity-io/plugins/pull/1083) [`7e65764`](https://github.com/sanity-io/plugins/commit/7e65764c026879d6156e49d8380e3bd6d85f0697) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): Update lodash monorepo to ^4.18.1

## 2.0.0

### Major Changes

- [#968](https://github.com/sanity-io/plugins/pull/968) [`24b1e90`](https://github.com/sanity-io/plugins/commit/24b1e907e56621628175cad88cc6437055e876f8) Thanks [@ChrisLaRocque](https://github.com/ChrisLaRocque), [@RitaDias](https://github.com/RitaDias), [@KJHeartbreaker](https://github.com/KJHeartbreaker)! - Port @sanity/sanity-plugin-async-list to the Sanity plugins monorepo

  This major release includes several breaking changes as part of the migration to the monorepo:

  - **React Compiler enabled**: The package is now built with React Compiler targeting React 19
  - **ESM-only**: CommonJS support has been removed. The package now ships only ESM
  - **React 19.2+ required**: Minimum React version is now 19.2 (previously ^18 || ^19)
  - **react-dom 19.2+ required**: `react-dom` is now a required peer dependency
  - **Sanity Studio v5+ required**: Minimum Sanity version is now v5 (Sanity v3 and v4 are no longer supported)
  - **Node.js 20.19+ required**: Minimum Node.js version is now 20.19 (previously >=18)

## [1.3.3](https://github.com/sanity-io/sanity-plugin-async-list/compare/v1.3.2...v1.3.3) (2025-12-29)

### Bug Fixes

- allow sanity v5 in peer dep ranges ([d90b92d](https://github.com/sanity-io/sanity-plugin-async-list/commit/d90b92d60715012a95c13702dedcbb9ec7ba8400))

## [1.3.2](https://github.com/sanity-io/sanity-plugin-async-list/compare/v1.3.1...v1.3.2) (2025-07-10)

### Bug Fixes

- **deps:** allow studio v4 in peer dep ranges ([2926c2f](https://github.com/sanity-io/sanity-plugin-async-list/commit/2926c2f53c256aea7f6c6e53b6fe3667a5735d6c))

## [1.3.1](https://github.com/sanity-io/sanity-plugin-async-list/compare/v1.3.0...v1.3.1) (2025-04-04)

### Bug Fixes

- add support for react 19 ([#13](https://github.com/sanity-io/sanity-plugin-async-list/issues/13)) ([92e9f8b](https://github.com/sanity-io/sanity-plugin-async-list/commit/92e9f8b75000435acfb5f9b6c713a74f2eb7cd18))

## [1.3.0](https://github.com/sanity-io/sanity-plugin-async-list/compare/v1.2.2...v1.3.0) (2024-12-13)

### Features

- expose client to loader ([#10](https://github.com/sanity-io/sanity-plugin-async-list/issues/10)) ([226331a](https://github.com/sanity-io/sanity-plugin-async-list/commit/226331a63b77bb06a5c2011f30e0ea2b087da316))

## [1.2.2](https://github.com/sanity-io/sanity-plugin-async-list/compare/v1.2.1...v1.2.2) (2024-12-13)

### Bug Fixes

- readonly and docs on schema options ([#9](https://github.com/sanity-io/sanity-plugin-async-list/issues/9)) ([3015c15](https://github.com/sanity-io/sanity-plugin-async-list/commit/3015c150184add8e82906dc15a60cbf452c7a61f))

## [1.2.1](https://github.com/sanity-io/sanity-plugin-async-list/compare/v1.2.0...v1.2.1) (2024-12-13)

### Bug Fixes

- infinite fetch when used as component ([#7](https://github.com/sanity-io/sanity-plugin-async-list/issues/7)) ([6ff14b0](https://github.com/sanity-io/sanity-plugin-async-list/commit/6ff14b020534a1d46fc35ac67e91d0a9ef3bd820))

## [1.2.0](https://github.com/sanity-io/sanity-plugin-async-list/compare/v1.1.1...v1.2.0) (2024-12-08)

### Features

- pass search query back to loader ([#6](https://github.com/sanity-io/sanity-plugin-async-list/issues/6)) ([7794480](https://github.com/sanity-io/sanity-plugin-async-list/commit/7794480f41a4040bddaab359071cd9769bb13ec9))

## [1.1.1](https://github.com/sanity-io/sanity-plugin-async-list/compare/v1.1.0...v1.1.1) (2024-12-06)

### Bug Fixes

- package.json ([a99e8e5](https://github.com/sanity-io/sanity-plugin-async-list/commit/a99e8e5093ac2ec21d0ac74b9b0489a4f95a5213))

## [1.1.0](https://github.com/sanity-io/sanity-plugin-async-list/compare/v1.0.0...v1.1.0) (2024-12-06)

### Features

- expose secrets ([#3](https://github.com/sanity-io/sanity-plugin-async-list/issues/3)) ([f3d5049](https://github.com/sanity-io/sanity-plugin-async-list/commit/f3d50498b9f8992783cb6fd2cb6f4973b4e95b6f))

## 1.0.0 (2024-12-06)

### Features

- add semantic-release workflow ([0919d49](https://github.com/sanity-io/sanity-plugin-async-list/commit/0919d49a8d75162c057eac05d4830742d11682fc))
- add semver config ([2171b2b](https://github.com/sanity-io/sanity-plugin-async-list/commit/2171b2bd41d95f2accaf99e9bc19503a689d1e9f))
- remove dry-run ([112d45e](https://github.com/sanity-io/sanity-plugin-async-list/commit/112d45e9f87443418adbb6337a5ee64cb3bf7572))
- semver workflow ([ec0d82c](https://github.com/sanity-io/sanity-plugin-async-list/commit/ec0d82c27624a9ba8da0723f78f207d4b40de586))
- swap to yarn ([94d050a](https://github.com/sanity-io/sanity-plugin-async-list/commit/94d050aa30aaae8b8a7f05d8548e2fb72faa7507))

### Bug Fixes

- bump version and pull deps ([c177212](https://github.com/sanity-io/sanity-plugin-async-list/commit/c17721269fe3fcd9e85e148220c4e06907ca7754))
- deps ([539590a](https://github.com/sanity-io/sanity-plugin-async-list/commit/539590abfddc5721585aa81d43be3e911430fed5))
- deps for semantic-release ([0b1ae86](https://github.com/sanity-io/sanity-plugin-async-list/commit/0b1ae86705659641101518b56ed3b6d3aa6d9a97))
- engines ([ca36861](https://github.com/sanity-io/sanity-plugin-async-list/commit/ca36861a0279dd7ef0132d0858444f33107a74fe))
- env name ([e2d68ea](https://github.com/sanity-io/sanity-plugin-async-list/commit/e2d68ea72344f28cbc7e5bd0197f7917ae8920e2))
- make public ([b925b17](https://github.com/sanity-io/sanity-plugin-async-list/commit/b925b172029398044fa2ebea05d4a13d17d1f0e3))
- overrides ([10a1227](https://github.com/sanity-io/sanity-plugin-async-list/commit/10a12277d181f41a76982d521730e3a0b6367784))
- pull dry-run ([aa1c96f](https://github.com/sanity-io/sanity-plugin-async-list/commit/aa1c96f3fe16af1311f184e5483d556339dd2b1a))
- regenerate ([4c32e55](https://github.com/sanity-io/sanity-plugin-async-list/commit/4c32e553c93a35d002abd2f4c0dcccd12aff45b9))
- regenerate package-lock ([5b63a30](https://github.com/sanity-io/sanity-plugin-async-list/commit/5b63a3088b517318accb87a3c7ecf4042f2452c7))
- regenerate package-lock.json ([ff3d149](https://github.com/sanity-io/sanity-plugin-async-list/commit/ff3d1491a2dac7c032ac3f1568939b9080c1361e))
- remove semantic-release for now ([87605b6](https://github.com/sanity-io/sanity-plugin-async-list/commit/87605b63ca75dfa0d7e6a50291b097c6ee187d9c))
- resolutions ([bacefea](https://github.com/sanity-io/sanity-plugin-async-list/commit/bacefea1986d3db9e9b57885036753e0ae84793d))
- resolve peer deps issues ([a56051b](https://github.com/sanity-io/sanity-plugin-async-list/commit/a56051b7e94bf57b1f527b51d4b70845102e9e03))
- tweak action ([be5f805](https://github.com/sanity-io/sanity-plugin-async-list/commit/be5f805cfbdd687bbd8177ca76024fbf887010ab))
- tweak workflow ([4959984](https://github.com/sanity-io/sanity-plugin-async-list/commit/4959984dda49fe85581ef4c2a0bc7c14204fd6dc))
- ui was being bundled ([8dd8899](https://github.com/sanity-io/sanity-plugin-async-list/commit/8dd889936d6750c85af2a824507b9dada2e045bb))
- update action ([2edca7f](https://github.com/sanity-io/sanity-plugin-async-list/commit/2edca7fe28629e2e6bb9db0ad8ef2333018dfbdd))
- updates action ([df9a4ac](https://github.com/sanity-io/sanity-plugin-async-list/commit/df9a4ac5b22330a3043cfdbe6ad0ca1c1a443926))

### Reverts

- add yarn ([54007e7](https://github.com/sanity-io/sanity-plugin-async-list/commit/54007e710f1c9515bd1fd39b4220dcfe53d52c42))
