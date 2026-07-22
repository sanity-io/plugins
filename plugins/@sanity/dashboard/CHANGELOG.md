# @sanity/dashboard

## 6.0.13

### Patch Changes

- [#1684](https://github.com/sanity-io/plugins/pull/1684) [`4ea0d1f`](https://github.com/sanity-io/plugins/commit/4ea0d1fd2eeb05b80f38e11aa17ca29390115999) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Update `@sanity/icons` dependency to the latest catalog version.

- [#1684](https://github.com/sanity-io/plugins/pull/1684) [`4ea0d1f`](https://github.com/sanity-io/plugins/commit/4ea0d1fd2eeb05b80f38e11aa17ca29390115999) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Update `@sanity/ui` dependency to the latest catalog version.

## 6.0.12

### Patch Changes

- [#1622](https://github.com/sanity-io/plugins/pull/1622) [`6fe3c11`](https://github.com/sanity-io/plugins/commit/6fe3c11e32b8187a19fbdc333e4a8b159fe5a616) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.9

## 6.0.11

### Patch Changes

- [#1596](https://github.com/sanity-io/plugins/pull/1596) [`f06fd76`](https://github.com/sanity-io/plugins/commit/f06fd767531740a09a5755f41fa1d3d42da202ae) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.8

## 6.0.10

### Patch Changes

- [#1571](https://github.com/sanity-io/plugins/pull/1571) [`52975b2`](https://github.com/sanity-io/plugins/commit/52975b2f0d4ea5086c800b2ce16190b862284a95) Thanks [@stipsan](https://github.com/stipsan)! - fix(deps): update tsdown to ^0.22.7 and @sanity/tsdown-config to ^0.14.0

## 6.0.9

### Patch Changes

- [#1519](https://github.com/sanity-io/plugins/pull/1519) [`a11d511`](https://github.com/sanity-io/plugins/commit/a11d511b371b332adc08197711583951eb294166) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.5

## 6.0.8

### Patch Changes

- [#1476](https://github.com/sanity-io/plugins/pull/1476) [`b8bc962`](https://github.com/sanity-io/plugins/commit/b8bc96275b26a3d219a55cd22e3d29b27e331e11) Thanks [@stipsan](https://github.com/stipsan)! - Remove a redundant type assertion in the tutorials widget (internal refactor, no API change)

## 6.0.7

### Patch Changes

- [#1491](https://github.com/sanity-io/plugins/pull/1491) [`2361892`](https://github.com/sanity-io/plugins/commit/236189294b6408c9bced43765e53cf26a11a0e66) Thanks [@stipsan](https://github.com/stipsan)! - Build with `tsdown` instead of `@sanity/pkg-utils`. Internal build-tooling change only, with no intended changes to the public API or runtime behavior.

## 6.0.6

### Patch Changes

- [#1481](https://github.com/sanity-io/plugins/pull/1481) [`0eae652`](https://github.com/sanity-io/plugins/commit/0eae652abea74fd63af2d334707afc8ecd4eb15a) Thanks [@stipsan](https://github.com/stipsan)! - Upgrade `@sanity/pkg-utils` to `^10.9.0`, enabling tree-shaking of unused `styled-components` in the published bundle. Tagged template literals are now transpiled to plain call expressions during build, so bundlers can drop styled components this plugin exports but the app doesn't use, reducing bundle size.

## 6.0.5

### Patch Changes

- [#1471](https://github.com/sanity-io/plugins/pull/1471) [`52487d2`](https://github.com/sanity-io/plugins/commit/52487d208f11fe2a4ccb523fab9386f3fbdd5880) Thanks [@stipsan](https://github.com/stipsan)! - Update `@sanity/icons` to v4 and adopt its per-icon import paths for smaller bundles and faster treeshaking

## 6.0.4

### Patch Changes

- [#1363](https://github.com/sanity-io/plugins/pull/1363) [`f9acf7c`](https://github.com/sanity-io/plugins/commit/f9acf7c0599e63feb30509f7d42ff941a01e2d35) Thanks [@stipsan](https://github.com/stipsan)! - Replace `React.forwardRef` with the React 19 ref-as-prop pattern. `DashboardWidgetContainer` is now a plain function component; it still accepts a `ref` as before.

## 6.0.3

### Patch Changes

- [#1184](https://github.com/sanity-io/plugins/pull/1184) [`0e56680`](https://github.com/sanity-io/plugins/commit/0e56680d767d3c4974d1d2fe860d962e9953269d) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency @sanity/icons to ^3.7.4

## 6.0.2

### Patch Changes

- [#1050](https://github.com/sanity-io/plugins/pull/1050) [`64578a5`](https://github.com/sanity-io/plugins/commit/64578a54eaaf6b24b9d3061b5d5acd704cc2e679) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): Update dependency @sanity/image-url to v2

## 6.0.1

### Patch Changes

- [#1047](https://github.com/sanity-io/plugins/pull/1047) [`050cc51`](https://github.com/sanity-io/plugins/commit/050cc51e260151b459dbe5d1d79d78302117210e) Thanks [@stipsan](https://github.com/stipsan)! - Give `projectUsersWidget` a unique `name` (`project-users`) so it no longer collides with `projectInfoWidget`, and fix the widget config example in the README.

## 6.0.0

### Major Changes

- [#977](https://github.com/sanity-io/plugins/pull/977) [`52d3d1c`](https://github.com/sanity-io/plugins/commit/52d3d1cb2c79ae78d5d2d505e9303532e2c827e7) Thanks [@stipsan](https://github.com/stipsan)! - Port @sanity/dashboard to the Sanity plugins monorepo

  This major release includes several breaking changes as part of the migration to the monorepo:

  - **React Compiler enabled**: The package is now built with React Compiler targeting React 19
  - **ESM-only**: CommonJS support has been removed. The package now ships only ESM
  - **React 19.2+ required**: Minimum React version is now 19.2 (previously ^18 || >=19.0.0-0)
  - **react-dom 19.2+ required**: `react-dom` is now a required peer dependency
  - **Sanity Studio v5+ required**: Minimum Sanity version is now v5 (Sanity v3 and v4 are no longer supported)
  - **Node.js 20.19+ required**: Minimum Node.js version is now 20.19 (previously >=18)

## [5.0.1](https://github.com/sanity-io/dashboard/compare/v5.0.0...v5.0.1) (2025-12-18)

### Bug Fixes

- **deps:** make peer dependencies include sanity 5.x ([#71](https://github.com/sanity-io/dashboard/issues/71)) ([1140616](https://github.com/sanity-io/dashboard/commit/1140616f4a9b1186455b51e4a607f6cad65c01a8))

## [5.0.0](https://github.com/sanity-io/dashboard/compare/v4.1.4...v5.0.0) (2025-09-15)

### ⚠ BREAKING CHANGES

- **deps:** update @sanity/ui to 3.x (#70)

### Features

- **deps:** update @sanity/ui to 3.x ([#70](https://github.com/sanity-io/dashboard/issues/70)) ([b3862d3](https://github.com/sanity-io/dashboard/commit/b3862d3dec1cdecb4273621d3c38c1a58bb88ce4))

## [4.1.4](https://github.com/sanity-io/dashboard/compare/v4.1.3...v4.1.4) (2025-07-10)

### Bug Fixes

- **deps:** allow studio v4 in peer dep ranges ([#67](https://github.com/sanity-io/dashboard/issues/67)) ([4472bf0](https://github.com/sanity-io/dashboard/commit/4472bf0833165b1e8e49f70d3e62d0b98be1e861))

## [4.1.3](https://github.com/sanity-io/dashboard/compare/v4.1.2...v4.1.3) (2025-03-10)

### Bug Fixes

- **deps:** bump dependencies for even better react 19 compatibility ([6ad8110](https://github.com/sanity-io/dashboard/commit/6ad811031d3b4bc786a1e62d5c82b01b916d8b38))

## [4.1.2](https://github.com/sanity-io/dashboard/compare/v4.1.1...v4.1.2) (2024-12-11)

### Bug Fixes

- **deps:** bump `[@sanity](https://github.com/sanity)` dependencies to react 19-compatible versions ([70442e9](https://github.com/sanity-io/dashboard/commit/70442e91c39ca14d8693f1715e84ea4a2286c0f5))

## [4.1.1](https://github.com/sanity-io/dashboard/compare/v4.1.0...v4.1.1) (2024-12-11)

### Bug Fixes

- **deps:** silence audit warnings ([957f4cf](https://github.com/sanity-io/dashboard/commit/957f4cf21f4e4b4534c87d37e3b19d4c2e619f00))
- **deps:** upgrade sanity dev dependency ([#64](https://github.com/sanity-io/dashboard/issues/64)) ([7b9ff32](https://github.com/sanity-io/dashboard/commit/7b9ff3290b40997539d50f7864a77fdedcbf8762))
- flag compatibility with React 19 ([f4ef8ed](https://github.com/sanity-io/dashboard/commit/f4ef8ed22dc230f97c050c2fb964f1999fe67816))

## [4.1.0](https://github.com/sanity-io/dashboard/compare/v4.0.0...v4.1.0) (2024-10-01)

### Features

- list all studios from user applications list ([#62](https://github.com/sanity-io/dashboard/issues/62)) ([f757d58](https://github.com/sanity-io/dashboard/commit/f757d58b7c7a6b5b61dd4c77de253102f22fda33))

### Bug Fixes

- **deps:** update non-major ([#60](https://github.com/sanity-io/dashboard/issues/60)) ([13b4b5a](https://github.com/sanity-io/dashboard/commit/13b4b5a499e22e54d3162b15757d54b3189f2170))

## [4.0.0](https://github.com/sanity-io/dashboard/compare/v3.1.6...v4.0.0) (2024-07-15)

### ⚠ BREAKING CHANGES

- This module now requires the peer dependency `styled-components` greater than or
  equal to version 6.1. This aligns with Sanity v3.37.0 and higher.
- This module now requires Node.js 18 or higher.
  This shouldn't really impact anyone beyond developers of the module, since this really only applies
  to the build tooling.

### Bug Fixes

- add request tags for all dashboard widget api requests ([528b92d](https://github.com/sanity-io/dashboard/commit/528b92dc2f1869d2d1fcff46000cb1b78aae675f))
- **projectInfo:** show external studio host if present ([36c6882](https://github.com/sanity-io/dashboard/commit/36c688211145e3dbed283b28f97898d13d6d77ef))
- **projectUsers:** show all of a users' roles, fix invite link + text ([4699add](https://github.com/sanity-io/dashboard/commit/4699add5706e3381d59c8d70353d30a7ce1b4123))
- require styled-components ^6.1, node >= 18 ([b0d9cb6](https://github.com/sanity-io/dashboard/commit/b0d9cb6726ec68d97550d1a465196835f463366d))
- upgrade build tooling, es/cjs export definitions ([21eaa29](https://github.com/sanity-io/dashboard/commit/21eaa29847b7157881d98c171fbaca74865cce17))
- use named import for styled-components ([5eec15a](https://github.com/sanity-io/dashboard/commit/5eec15ad6a9fdfae4d05b186576459bf302d3898))

## [3.1.6](https://github.com/sanity-io/dashboard/compare/v3.1.5...v3.1.6) (2023-11-30)

### Bug Fixes

- **deps:** Update dependency styled-components to v6 ([#41](https://github.com/sanity-io/dashboard/issues/41)) ([4db1ccb](https://github.com/sanity-io/dashboard/commit/4db1ccb64eff362e97c5c21d027f1fec9519f5db))

## [3.1.5](https://github.com/sanity-io/dashboard/compare/v3.1.4...v3.1.5) (2023-08-02)

### Bug Fixes

- **deps:** update dependencies (non-major) ([#18](https://github.com/sanity-io/dashboard/issues/18)) ([657bcfc](https://github.com/sanity-io/dashboard/commit/657bcfc631355b5f53727998e6d8ab75539ce577))

## [3.1.4](https://github.com/sanity-io/dashboard/compare/v3.1.3...v3.1.4) (2023-05-03)

### Bug Fixes

- **docs:** Update README.md ([#31](https://github.com/sanity-io/dashboard/issues/31)) ([c7450b9](https://github.com/sanity-io/dashboard/commit/c7450b98f417ed3f09e1f1a915ca59f082b0106a))

## [3.1.3](https://github.com/sanity-io/dashboard/compare/v3.1.2...v3.1.3) (2023-01-31)

### Bug Fixes

- **docs:** add instructions on customizing name, title, icon ([e7bb30b](https://github.com/sanity-io/dashboard/commit/e7bb30b34402d216d53a54fa65a37e098300fc6c))

## [3.1.2](https://github.com/sanity-io/dashboard/compare/v3.1.1...v3.1.2) (2023-01-04)

### Bug Fixes

- **deps:** applied npx @sanity/plugin-kit inject ([300067e](https://github.com/sanity-io/dashboard/commit/300067e12549d04817d1dae24a61992b57a426fa))

## [3.1.1](https://github.com/sanity-io/dashboard/compare/v3.1.0...v3.1.1) (2022-12-22)

### Bug Fixes

- **ui:** dashboard content overflowed layout ([0aa8cbe](https://github.com/sanity-io/dashboard/commit/0aa8cbed0d4775d667d51c86ea61e645c89c1b9a))

## [3.1.0](https://github.com/sanity-io/dashboard/compare/v3.0.0...v3.1.0) (2022-12-22)

### Features

- make name and icon configurable ([6db4c65](https://github.com/sanity-io/dashboard/commit/6db4c6573d558881621b764a4c124a431a1071d8))
- make title configurable ([36fcaf8](https://github.com/sanity-io/dashboard/commit/36fcaf8fa8274aa8724a2bd6ae33c0b50e5bfd6e))

## [3.0.0](https://github.com/sanity-io/dashboard/compare/v2.35.2...v3.0.0) (2022-11-25)

### ⚠ BREAKING CHANGES

- this version does not work in Sanity Studio v2
- this version does not work in Sanity Studio v2
- semantic-release is being difficult

### Features

- dummy breaking to trick semantic-release ([53dd9dc](https://github.com/sanity-io/dashboard/commit/53dd9dcae19e2d6db97e11302867c3838ff155c6))
- initial release for Sanity Studio v3 ([4e3db99](https://github.com/sanity-io/dashboard/commit/4e3db99e83e49c5876db83c3fc3fe0ff5c3d3725))
- initial Sanity Studio v3 release ([9ea2f0a](https://github.com/sanity-io/dashboard/commit/9ea2f0a7146464f197598a63336f2500ff836aae))

### Bug Fixes

- compiled for dev-preview.22 ([3b97135](https://github.com/sanity-io/dashboard/commit/3b97135143ee29f2e1c2bae6f8e6ae051a943d4b))
- compiled for sanity 3.0.0-rc.0 ([74dfd9a](https://github.com/sanity-io/dashboard/commit/74dfd9a3db922649f32e52f990a80c5de7d1a752))
- **deps:** dev-preview.21 ([730cc2a](https://github.com/sanity-io/dashboard/commit/730cc2a25a36f57e5c3310079e262b39d8412774))
- **deps:** pin dependencies ([5fc3f9d](https://github.com/sanity-io/dashboard/commit/5fc3f9d276116dffcc957ed39b3a3e876a479fbf))
- **deps:** pkg-utils & @sanity/plugin-kit ([7d63c7c](https://github.com/sanity-io/dashboard/commit/7d63c7c05d274ab5d26fefd3da7807264f17b468))
- **deps:** sanity ^3.0.0 (works with rc.3) ([eeb0c7c](https://github.com/sanity-io/dashboard/commit/eeb0c7cdfd628ead3dcab39f7ce3cb2df2f1f784))
- **deps:** sanity 3.0.0-dev-preview.17 ([bed90ee](https://github.com/sanity-io/dashboard/commit/bed90eeaa3c6d2f9a8cda3a9c597e792d2816cff))
- **deps:** update dependency @sanity/icons to v1.3.9-beta.3 ([#12](https://github.com/sanity-io/dashboard/issues/12)) ([b547871](https://github.com/sanity-io/dashboard/commit/b5478710f11d58d898e1eaf638b702dece12edaa))
- **deps:** update dependency rxjs to ^6.6.7 ([#4](https://github.com/sanity-io/dashboard/issues/4)) ([b79f4be](https://github.com/sanity-io/dashboard/commit/b79f4bec0661c32f8b1a797f82ea22195ec583d9))
- **deps:** updated deps and added semver workflow ([68d714e](https://github.com/sanity-io/dashboard/commit/68d714e2b3457fbd4ab112a7cbc6194057b61e36))

## [3.0.0-v3-studio.8](https://github.com/sanity-io/dashboard/compare/v3.0.0-v3-studio.7...v3.0.0-v3-studio.8) (2022-11-04)

### Bug Fixes

- **deps:** pkg-utils & @sanity/plugin-kit ([7d63c7c](https://github.com/sanity-io/dashboard/commit/7d63c7c05d274ab5d26fefd3da7807264f17b468))

## [3.0.0-v3-studio.7](https://github.com/sanity-io/dashboard/compare/v3.0.0-v3-studio.6...v3.0.0-v3-studio.7) (2022-11-04)

### Bug Fixes

- **deps:** pin dependencies ([5fc3f9d](https://github.com/sanity-io/dashboard/commit/5fc3f9d276116dffcc957ed39b3a3e876a479fbf))
- **deps:** update dependency @sanity/icons to v1.3.9-beta.3 ([#12](https://github.com/sanity-io/dashboard/issues/12)) ([b547871](https://github.com/sanity-io/dashboard/commit/b5478710f11d58d898e1eaf638b702dece12edaa))
- **deps:** update dependency rxjs to ^6.6.7 ([#4](https://github.com/sanity-io/dashboard/issues/4)) ([b79f4be](https://github.com/sanity-io/dashboard/commit/b79f4bec0661c32f8b1a797f82ea22195ec583d9))

## [3.0.0-v3-studio.6](https://github.com/sanity-io/dashboard/compare/v3.0.0-v3-studio.5...v3.0.0-v3-studio.6) (2022-11-02)

### Bug Fixes

- compiled for sanity 3.0.0-rc.0 ([74dfd9a](https://github.com/sanity-io/dashboard/commit/74dfd9a3db922649f32e52f990a80c5de7d1a752))

## [3.0.0-v3-studio.5](https://github.com/sanity-io/dashboard/compare/v3.0.0-v3-studio.4...v3.0.0-v3-studio.5) (2022-10-27)

### Bug Fixes

- compiled for dev-preview.22 ([3b97135](https://github.com/sanity-io/dashboard/commit/3b97135143ee29f2e1c2bae6f8e6ae051a943d4b))

## [3.0.0-v3-studio.4](https://github.com/sanity-io/dashboard/compare/v3.0.0-v3-studio.3...v3.0.0-v3-studio.4) (2022-10-07)

### Bug Fixes

- **deps:** dev-preview.21 ([730cc2a](https://github.com/sanity-io/dashboard/commit/730cc2a25a36f57e5c3310079e262b39d8412774))

## [3.0.0-v3-studio.3](https://github.com/sanity-io/dashboard/compare/v3.0.0-v3-studio.2...v3.0.0-v3-studio.3) (2022-09-15)

### Bug Fixes

- **deps:** sanity 3.0.0-dev-preview.17 ([bed90ee](https://github.com/sanity-io/dashboard/commit/bed90eeaa3c6d2f9a8cda3a9c597e792d2816cff))

## [3.0.0-v3-studio.2](https://github.com/sanity-io/dashboard/compare/v3.0.0-v3-studio.1...v3.0.0-v3-studio.2) (2022-09-14)

### ⚠ BREAKING CHANGES

- semantic-release is being difficult

### Features

- dummy breaking to trick semantic-release ([53dd9dc](https://github.com/sanity-io/dashboard/commit/53dd9dcae19e2d6db97e11302867c3838ff155c6))

### Bug Fixes

- **deps:** updated deps and added semver workflow ([68d714e](https://github.com/sanity-io/dashboard/commit/68d714e2b3457fbd4ab112a7cbc6194057b61e36))
