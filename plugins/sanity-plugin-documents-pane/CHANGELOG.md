# sanity-plugin-documents-pane

## 4.1.12

### Patch Changes

- [#1622](https://github.com/sanity-io/plugins/pull/1622) [`6fe3c11`](https://github.com/sanity-io/plugins/commit/6fe3c11e32b8187a19fbdc333e4a8b159fe5a616) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.9

- Updated dependencies [[`6fe3c11`](https://github.com/sanity-io/plugins/commit/6fe3c11e32b8187a19fbdc333e4a8b159fe5a616)]:
  - sanity-plugin-utils@2.0.10

## 4.1.11

### Patch Changes

- [#1596](https://github.com/sanity-io/plugins/pull/1596) [`f06fd76`](https://github.com/sanity-io/plugins/commit/f06fd767531740a09a5755f41fa1d3d42da202ae) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.8

- Updated dependencies [[`f06fd76`](https://github.com/sanity-io/plugins/commit/f06fd767531740a09a5755f41fa1d3d42da202ae)]:
  - sanity-plugin-utils@2.0.9

## 4.1.10

### Patch Changes

- [#1571](https://github.com/sanity-io/plugins/pull/1571) [`52975b2`](https://github.com/sanity-io/plugins/commit/52975b2f0d4ea5086c800b2ce16190b862284a95) Thanks [@stipsan](https://github.com/stipsan)! - fix(deps): update tsdown to ^0.22.7 and @sanity/tsdown-config to ^0.14.0

- Updated dependencies [[`52975b2`](https://github.com/sanity-io/plugins/commit/52975b2f0d4ea5086c800b2ce16190b862284a95)]:
  - sanity-plugin-utils@2.0.8

## 4.1.9

### Patch Changes

- [#1519](https://github.com/sanity-io/plugins/pull/1519) [`a11d511`](https://github.com/sanity-io/plugins/commit/a11d511b371b332adc08197711583951eb294166) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.5

- Updated dependencies [[`a11d511`](https://github.com/sanity-io/plugins/commit/a11d511b371b332adc08197711583951eb294166)]:
  - sanity-plugin-utils@2.0.7

## 4.1.8

### Patch Changes

- [#1491](https://github.com/sanity-io/plugins/pull/1491) [`2361892`](https://github.com/sanity-io/plugins/commit/236189294b6408c9bced43765e53cf26a11a0e66) Thanks [@stipsan](https://github.com/stipsan)! - Build with `tsdown` instead of `@sanity/pkg-utils`. Internal build-tooling change only, with no intended changes to the public API or runtime behavior.

- Updated dependencies [[`2361892`](https://github.com/sanity-io/plugins/commit/236189294b6408c9bced43765e53cf26a11a0e66)]:
  - sanity-plugin-utils@2.0.6

## 4.1.7

### Patch Changes

- [#1481](https://github.com/sanity-io/plugins/pull/1481) [`0eae652`](https://github.com/sanity-io/plugins/commit/0eae652abea74fd63af2d334707afc8ecd4eb15a) Thanks [@stipsan](https://github.com/stipsan)! - Upgrade `@sanity/pkg-utils` to `^10.9.0`, enabling tree-shaking of unused `styled-components` in the published bundle. Tagged template literals are now transpiled to plain call expressions during build, so bundlers can drop styled components this plugin exports but the app doesn't use, reducing bundle size.

- Updated dependencies [[`0eae652`](https://github.com/sanity-io/plugins/commit/0eae652abea74fd63af2d334707afc8ecd4eb15a)]:
  - sanity-plugin-utils@2.0.5

## 4.1.6

### Patch Changes

- [#1471](https://github.com/sanity-io/plugins/pull/1471) [`52487d2`](https://github.com/sanity-io/plugins/commit/52487d208f11fe2a4ccb523fab9386f3fbdd5880) Thanks [@stipsan](https://github.com/stipsan)! - Update `@sanity/icons` to v4 and adopt its per-icon import paths for smaller bundles and faster treeshaking

- Updated dependencies [[`52487d2`](https://github.com/sanity-io/plugins/commit/52487d208f11fe2a4ccb523fab9386f3fbdd5880)]:
  - sanity-plugin-utils@2.0.4

## 4.1.5

### Patch Changes

- [#1304](https://github.com/sanity-io/plugins/pull/1304) [`5d2195a`](https://github.com/sanity-io/plugins/commit/5d2195a8b56b1907391a6bfb9cff9ca5448bc9dc) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency @sanity/uuid to ^3.0.3

## 4.1.4

### Patch Changes

- [`7a37fd1`](https://github.com/sanity-io/plugins/commit/7a37fd1653681de5f892de2dea29b83e9b119ff1) Thanks [@stipsan](https://github.com/stipsan)! - use `workspace:^` for prod deps

- Updated dependencies [[`7c1a95c`](https://github.com/sanity-io/plugins/commit/7c1a95c2213555c50bca2fde2af3590abc57c444)]:
  - sanity-plugin-utils@2.0.3

## 4.1.3

### Patch Changes

- Updated dependencies [[`c66b926`](https://github.com/sanity-io/plugins/commit/c66b9269394b2ec45c320580a39069e6fd39dd4d)]:
  - sanity-plugin-utils@2.0.2

## 4.1.2

### Patch Changes

- [#980](https://github.com/sanity-io/plugins/pull/980) [`98d148e`](https://github.com/sanity-io/plugins/commit/98d148e00ef679b422e1effe7fc53dfce9cb046c) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Update `@sanity/pkg-utils` to pick up a DTS generation bug fix.

- Updated dependencies [[`98d148e`](https://github.com/sanity-io/plugins/commit/98d148e00ef679b422e1effe7fc53dfce9cb046c)]:
  - sanity-plugin-utils@2.0.1

## 4.1.1

### Patch Changes

- [#964](https://github.com/sanity-io/plugins/pull/964) [`4226408`](https://github.com/sanity-io/plugins/commit/4226408594d2717cf2503866f5d5216991701d38) Thanks [@stipsan](https://github.com/stipsan)! - Update `@sanity/util` dependency to v6, in line with Sanity Studio v6

## 4.1.0

### Minor Changes

- [#949](https://github.com/sanity-io/plugins/pull/949) [`bde3e70`](https://github.com/sanity-io/plugins/commit/bde3e70bfe1438768a4f4d349a3c0d2b3313fd3d) Thanks [@pedrobonamin](https://github.com/pedrobonamin)! - Show document count in the documents pane view

## 4.0.0

### Major Changes

- [#938](https://github.com/sanity-io/plugins/pull/938) [`5f8d73c`](https://github.com/sanity-io/plugins/commit/5f8d73cb898a336013b0d6c3be8ba674de62e26a) Thanks [@pedrobonamin](https://github.com/pedrobonamin)! - Port sanity-plugin-documents-pane to the Sanity plugins monorepo

  This major release includes several breaking changes as part of the migration to the monorepo:

  - **React Compiler enabled**: The package is now built with React Compiler targeting React 19
  - **ESM-only**: CommonJS support has been removed. The package now ships only ESM
  - **React 19.2+ required**: Minimum React version is now 19.2 (previously ^18.3 || ^19)
  - **Sanity Studio v5+ required**: Minimum Sanity version is now v5 (Sanity v3 and v4 are no longer supported)
  - **sanity-plugin-utils 2.x required**: The plugin now depends on sanity-plugin-utils v2 from the monorepo (previously ^1.7.0)
  - **Node.js 20.19+ required**: Minimum Node.js version is now 20.19 (previously >=18)

## [3.0.2](https://github.com/sanity-io/sanity-plugin-documents-pane/compare/v3.0.1...v3.0.2) (2025-12-29)

### Bug Fixes

- **deps:** allow studio v5 in peer deps ranges ([#78](https://github.com/sanity-io/sanity-plugin-documents-pane/issues/78)) ([ab115c8](https://github.com/sanity-io/sanity-plugin-documents-pane/commit/ab115c8c90321ef22ebea046b8e641ccf43f26e5))

## [3.0.1](https://github.com/sanity-io/sanity-plugin-documents-pane/compare/v3.0.0...v3.0.1) (2025-11-04)

### Bug Fixes

- **deps:** update sanity-plugin-utils ([#77](https://github.com/sanity-io/sanity-plugin-documents-pane/issues/77)) ([c15c9fa](https://github.com/sanity-io/sanity-plugin-documents-pane/commit/c15c9fadab457232bd3716e21afda01ecdb6c3f7))

## [3.0.0](https://github.com/sanity-io/sanity-plugin-documents-pane/compare/v2.4.1...v3.0.0) (2025-09-15)

### ⚠ BREAKING CHANGES

- **deps:** update @sanity/ui to 3.x (#76)

### Features

- **deps:** update @sanity/ui to 3.x ([#76](https://github.com/sanity-io/sanity-plugin-documents-pane/issues/76)) ([0a90797](https://github.com/sanity-io/sanity-plugin-documents-pane/commit/0a90797ba0dc860a572cf98f1b2406eb2a28d932))

## [2.4.1](https://github.com/sanity-io/sanity-plugin-documents-pane/compare/v2.4.0...v2.4.1) (2025-07-10)

### Bug Fixes

- **deps:** allow studio v4 peer dep ranges ([2dd81af](https://github.com/sanity-io/sanity-plugin-documents-pane/commit/2dd81af073432ba36b8962e24d2190dd9ecc5258))

## [2.4.0](https://github.com/sanity-io/sanity-plugin-documents-pane/compare/v2.3.0...v2.4.0) (2025-03-07)

### Features

- add react 19 to peer deps ([620f2ad](https://github.com/sanity-io/sanity-plugin-documents-pane/commit/620f2ad86418b234c56acf128976cc0b63ca16cb))

## [2.3.0](https://github.com/sanity-io/sanity-plugin-documents-pane/compare/v2.2.2...v2.3.0) (2024-05-01)

### Features

- added duplicate action to doc list ([#68](https://github.com/sanity-io/sanity-plugin-documents-pane/issues/68)) ([8d65f8f](https://github.com/sanity-io/sanity-plugin-documents-pane/commit/8d65f8faedc23a70ee192a59e56503fc5da3cc46))

## [2.2.2](https://github.com/sanity-io/sanity-plugin-documents-pane/compare/v2.2.1...v2.2.2) (2024-04-19)

### Bug Fixes

- update peer dependency of `sanity` to when `sanity/stucture` was introduced ([f8b9729](https://github.com/sanity-io/sanity-plugin-documents-pane/commit/f8b9729e77b93e8d670755f7611a11b5b226d843))

## [2.2.1](https://github.com/sanity-io/sanity-plugin-documents-pane/compare/v2.2.0...v2.2.1) (2024-01-31)

### Bug Fixes

- update dependencies ([#66](https://github.com/sanity-io/sanity-plugin-documents-pane/issues/66)) ([322a8e0](https://github.com/sanity-io/sanity-plugin-documents-pane/commit/322a8e00f86b4c8198a57b5477742ac9dc376daa))

## [2.2.0](https://github.com/sanity-io/sanity-plugin-documents-pane/compare/v2.1.2...v2.2.0) (2024-01-16)

### Features

- support perspectives ([#63](https://github.com/sanity-io/sanity-plugin-documents-pane/issues/63)) ([e2eb3bb](https://github.com/sanity-io/sanity-plugin-documents-pane/commit/e2eb3bb791d1ab12525ae02dc357d7768af1d846))

## [2.1.2](https://github.com/sanity-io/sanity-plugin-documents-pane/compare/v2.1.1...v2.1.2) (2023-10-16)

### Bug Fixes

- upgrade to latest hooks and components from plugin-utils ([#55](https://github.com/sanity-io/sanity-plugin-documents-pane/issues/55)) ([1975b08](https://github.com/sanity-io/sanity-plugin-documents-pane/commit/1975b08ea89155d6418cb3f69abf3ab02036debc))

## [2.1.1](https://github.com/sanity-io/sanity-plugin-documents-pane/compare/v2.1.0...v2.1.1) (2023-09-01)

### Bug Fixes

- **deps:** update dependencies (non-major) ([#13](https://github.com/sanity-io/sanity-plugin-documents-pane/issues/13)) ([4190889](https://github.com/sanity-io/sanity-plugin-documents-pane/commit/41908893752ab2a6701537362ebf650ca55aff67))
- **deps:** update dependency react-fast-compare to v3.2.2 ([#43](https://github.com/sanity-io/sanity-plugin-documents-pane/issues/43)) ([0d4272a](https://github.com/sanity-io/sanity-plugin-documents-pane/commit/0d4272a5c32d295f3c6e5e6d01debff4598674ee))
- **docs:** fixed install instruction ([e0cb7b2](https://github.com/sanity-io/sanity-plugin-documents-pane/commit/e0cb7b209fe769feb5785a2e32c16dc5f06a116f))

## [2.1.0](https://github.com/sanity-io/sanity-plugin-documents-pane/compare/v2.0.1...v2.1.0) (2023-02-02)

### Features

- warn on unknown schema type ([755ef81](https://github.com/sanity-io/sanity-plugin-documents-pane/commit/755ef81082224b4cc02acb5417987bf84e3b4d3c))

## [2.0.1](https://github.com/sanity-io/sanity-plugin-documents-pane/compare/v2.0.0...v2.0.1) (2022-11-25)

### Bug Fixes

- **deps:** sanity ^3.0.0 (works with rc.3) ([3c7c979](https://github.com/sanity-io/sanity-plugin-documents-pane/commit/3c7c979afa66c4a9355180f49127a24255ac6120))

## [2.0.0](https://github.com/sanity-io/sanity-plugin-documents-pane/compare/v1.1.0...v2.0.0) (2022-11-17)

### ⚠ BREAKING CHANGES

- this version no longer works in Sanity Studio v2
- initial studio v3 version

### Features

- initial Sanity Studio v3 release ([b6b7df9](https://github.com/sanity-io/sanity-plugin-documents-pane/commit/b6b7df99d38bc10b6c9585fd57e09b89f5e58c2d))
- initial studio v3 version ([31b37ef](https://github.com/sanity-io/sanity-plugin-documents-pane/commit/31b37ef159f942eebf5665a574156d2ee66a1265))

### Bug Fixes

- compiled for sanity 3.0.0-rc.0 ([244af05](https://github.com/sanity-io/sanity-plugin-documents-pane/commit/244af052fe819efdad0bae777dc330cb7de8ed54))
- **deps:** dev-preview.21 ([94a2e3e](https://github.com/sanity-io/sanity-plugin-documents-pane/commit/94a2e3eb361776d4389993f017a20120674b6647))
- **deps:** dev-preview.22 ([e3d4641](https://github.com/sanity-io/sanity-plugin-documents-pane/commit/e3d4641b3f179c6243de1a4be44aab0db4a64112))
- **deps:** pkg-utils & @sanity/plugin-kit ([6db80dd](https://github.com/sanity-io/sanity-plugin-documents-pane/commit/6db80dda1c8821261fbc2004c55a20380d0ab48b))

## [2.0.0-v3-studio.5](https://github.com/sanity-io/sanity-plugin-documents-pane/compare/v2.0.0-v3-studio.4...v2.0.0-v3-studio.5) (2022-11-04)

### Bug Fixes

- **deps:** pkg-utils & @sanity/plugin-kit ([6db80dd](https://github.com/sanity-io/sanity-plugin-documents-pane/commit/6db80dda1c8821261fbc2004c55a20380d0ab48b))

## [2.0.0-v3-studio.4](https://github.com/sanity-io/sanity-plugin-documents-pane/compare/v2.0.0-v3-studio.3...v2.0.0-v3-studio.4) (2022-11-02)

### Bug Fixes

- compiled for sanity 3.0.0-rc.0 ([244af05](https://github.com/sanity-io/sanity-plugin-documents-pane/commit/244af052fe819efdad0bae777dc330cb7de8ed54))

## [2.0.0-v3-studio.3](https://github.com/sanity-io/sanity-plugin-documents-pane/compare/v2.0.0-v3-studio.2...v2.0.0-v3-studio.3) (2022-10-27)

### Bug Fixes

- **deps:** dev-preview.22 ([e3d4641](https://github.com/sanity-io/sanity-plugin-documents-pane/commit/e3d4641b3f179c6243de1a4be44aab0db4a64112))

## [2.0.0-v3-studio.2](https://github.com/sanity-io/sanity-plugin-documents-pane/compare/v2.0.0-v3-studio.1...v2.0.0-v3-studio.2) (2022-10-07)

### Bug Fixes

- **deps:** dev-preview.21 ([94a2e3e](https://github.com/sanity-io/sanity-plugin-documents-pane/commit/94a2e3eb361776d4389993f017a20120674b6647))

## [2.0.0-v3-studio.1](https://github.com/sanity-io/sanity-plugin-documents-pane/compare/v1.1.0...v2.0.0-v3-studio.1) (2022-10-05)

### ⚠ BREAKING CHANGES

- initial studio v3 version

### Features

- initial studio v3 version ([31b37ef](https://github.com/sanity-io/sanity-plugin-documents-pane/commit/31b37ef159f942eebf5665a574156d2ee66a1265))

## 1.0.0-v3-studio.1 (2022-10-04)

### ⚠ BREAKING CHANGES

- initial studio v3 version

### Features

- initial studio v3 version ([6672199](https://github.com/sanity-io/sanity-plugin-documents-pane/commit/6672199a578abfc3636d5bc3291ab8d4c88bc27a))
