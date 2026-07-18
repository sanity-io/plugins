# sanity-plugin-dashboard-widget-vercel

## 4.0.18

### Patch Changes

- [#1622](https://github.com/sanity-io/plugins/pull/1622) [`6fe3c11`](https://github.com/sanity-io/plugins/commit/6fe3c11e32b8187a19fbdc333e4a8b159fe5a616) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.9

## 4.0.17

### Patch Changes

- [#1596](https://github.com/sanity-io/plugins/pull/1596) [`f06fd76`](https://github.com/sanity-io/plugins/commit/f06fd767531740a09a5755f41fa1d3d42da202ae) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.8

- [#1597](https://github.com/sanity-io/plugins/pull/1597) [`314c536`](https://github.com/sanity-io/plugins/commit/314c5365e708aae8518a131b3b08e6e528bfcf30) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency xstate to ^5.32.5

## 4.0.16

### Patch Changes

- [#1571](https://github.com/sanity-io/plugins/pull/1571) [`52975b2`](https://github.com/sanity-io/plugins/commit/52975b2f0d4ea5086c800b2ce16190b862284a95) Thanks [@stipsan](https://github.com/stipsan)! - fix(deps): update tsdown to ^0.22.7 and @sanity/tsdown-config to ^0.14.0

## 4.0.15

### Patch Changes

- [#1519](https://github.com/sanity-io/plugins/pull/1519) [`a11d511`](https://github.com/sanity-io/plugins/commit/a11d511b371b332adc08197711583951eb294166) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.5

- [#1535](https://github.com/sanity-io/plugins/pull/1535) [`c1601d5`](https://github.com/sanity-io/plugins/commit/c1601d548e294f1733c40125f1b1a03894703084) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency @tanstack/react-query to ^5.101.2

- [#1547](https://github.com/sanity-io/plugins/pull/1547) [`78c04b4`](https://github.com/sanity-io/plugins/commit/78c04b45aa830c3fb6337da7cc81ac23b0626a22) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency react-hook-form to ^7.81.0

## 4.0.14

### Patch Changes

- [#1494](https://github.com/sanity-io/plugins/pull/1494) [`588ed91`](https://github.com/sanity-io/plugins/commit/588ed913311558585a54a2b23d61075d1422f658) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency xstate to ^5.32.4

## 4.0.13

### Patch Changes

- [#1491](https://github.com/sanity-io/plugins/pull/1491) [`2361892`](https://github.com/sanity-io/plugins/commit/236189294b6408c9bced43765e53cf26a11a0e66) Thanks [@stipsan](https://github.com/stipsan)! - Build with `tsdown` instead of `@sanity/pkg-utils`. Internal build-tooling change only, with no intended changes to the public API or runtime behavior.

## 4.0.12

### Patch Changes

- [#1460](https://github.com/sanity-io/plugins/pull/1460) [`f50f060`](https://github.com/sanity-io/plugins/commit/f50f0605968e5cec4f23f5f3455abe5c8ddda23c) Thanks [@stipsan](https://github.com/stipsan)! - Regenerate TypeScript declaration output: `isolatedDeclarations` is no longer used and declarations are now generated with tsgo (`@typescript/native-preview`). Internal build-tooling change only, with no runtime behavior or public API changes.

## 4.0.11

### Patch Changes

- [#1481](https://github.com/sanity-io/plugins/pull/1481) [`0eae652`](https://github.com/sanity-io/plugins/commit/0eae652abea74fd63af2d334707afc8ecd4eb15a) Thanks [@stipsan](https://github.com/stipsan)! - Upgrade `@sanity/pkg-utils` to `^10.9.0`, enabling tree-shaking of unused `styled-components` in the published bundle. Tagged template literals are now transpiled to plain call expressions during build, so bundlers can drop styled components this plugin exports but the app doesn't use, reducing bundle size.

## 4.0.10

### Patch Changes

- [#1471](https://github.com/sanity-io/plugins/pull/1471) [`52487d2`](https://github.com/sanity-io/plugins/commit/52487d208f11fe2a4ccb523fab9386f3fbdd5880) Thanks [@stipsan](https://github.com/stipsan)! - Update `@sanity/icons` to v4 and adopt its per-icon import paths for smaller bundles and faster treeshaking

## 4.0.9

### Patch Changes

- [#1363](https://github.com/sanity-io/plugins/pull/1363) [`f9acf7c`](https://github.com/sanity-io/plugins/commit/f9acf7c0599e63feb30509f7d42ff941a01e2d35) Thanks [@stipsan](https://github.com/stipsan)! - Replace `React.forwardRef` with the React 19 ref-as-prop pattern (internal refactor, no API change)

- [#1469](https://github.com/sanity-io/plugins/pull/1469) [`c5c3a42`](https://github.com/sanity-io/plugins/commit/c5c3a423a889cbde2e58cba8bfdd194c1775b6d6) Thanks [@mitchuman](https://github.com/mitchuman)! - Fix a crash in the deployments widget ("No locale data has been registered for any of the locales: en-US, en, en") by bumping `@sanity/pkg-utils`.

  The published bundle was silently dropping the side-effect-only `react-time-ago/locale/en` import, because pkg-utils' tree-shaking treated all external imports as side-effect free. Thanks to @mitchuman for discovering the root cause and reporting it in [#1468](https://github.com/sanity-io/plugins/pull/1468) — it was fixed upstream in [`@sanity/pkg-utils`](https://github.com/sanity-io/pkg-utils/pull/2934), so no source changes were needed here beyond the dependency bump.

## 4.0.8

### Patch Changes

- [#1424](https://github.com/sanity-io/plugins/pull/1424) [`56ef1aa`](https://github.com/sanity-io/plugins/commit/56ef1aa2134022b509edcd225dcf6775a82ea359) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency @tanstack/react-query to ^5.101.1

- [#1437](https://github.com/sanity-io/plugins/pull/1437) [`9786ded`](https://github.com/sanity-io/plugins/commit/9786ded76ef680abb4a4d9827eae7059cceb7400) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency xstate to ^5.32.2

## 4.0.7

### Patch Changes

- [#1396](https://github.com/sanity-io/plugins/pull/1396) [`6e30c3c`](https://github.com/sanity-io/plugins/commit/6e30c3c6d454cb05e08b23dcc7cba7c8b7c8e72b) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency react-hook-form to ^7.80.0

## 4.0.6

### Patch Changes

- [#1376](https://github.com/sanity-io/plugins/pull/1376) [`ca14e36`](https://github.com/sanity-io/plugins/commit/ca14e36eb6d5cb1bffdc2d58393b8a39456c5dd2) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update tanstack-query monorepo

- [#1373](https://github.com/sanity-io/plugins/pull/1373) [`0f2e85c`](https://github.com/sanity-io/plugins/commit/0f2e85c3ccaf086efb2715ad5b9211bdc6d9c1cf) Thanks [@stipsan](https://github.com/stipsan)! - Remove direct `javascript-time-ago` dependency now that `react-time-ago` bundles it

## 4.0.5

### Patch Changes

- [#1304](https://github.com/sanity-io/plugins/pull/1304) [`5d2195a`](https://github.com/sanity-io/plugins/commit/5d2195a8b56b1907391a6bfb9cff9ca5448bc9dc) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency @sanity/uuid to ^3.0.3

- [#1315](https://github.com/sanity-io/plugins/pull/1315) [`f171c85`](https://github.com/sanity-io/plugins/commit/f171c85b2988a3ab4146a4dae12db62c3712b61a) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency javascript-time-ago to ^2.6.4

- [#1321](https://github.com/sanity-io/plugins/pull/1321) [`ca52ded`](https://github.com/sanity-io/plugins/commit/ca52dedfb0c15d71f9643bcaa7320fa6df61920d) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency react-hook-form to ^7.79.0

- [#1327](https://github.com/sanity-io/plugins/pull/1327) [`cb214d2`](https://github.com/sanity-io/plugins/commit/cb214d2bc1216519407747fe8ba4e85a7bf35c63) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency react-time-ago to ^7.4.4

- [#1339](https://github.com/sanity-io/plugins/pull/1339) [`26ff1a7`](https://github.com/sanity-io/plugins/commit/26ff1a7a06b3837a08b7befee5486988cc45645e) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency @hookform/resolvers to v4.1.3

## 4.0.4

### Patch Changes

- [#1184](https://github.com/sanity-io/plugins/pull/1184) [`0e56680`](https://github.com/sanity-io/plugins/commit/0e56680d767d3c4974d1d2fe860d962e9953269d) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency @sanity/icons to ^3.7.4

## 4.0.3

### Patch Changes

- [#1085](https://github.com/sanity-io/plugins/pull/1085) [`59909e9`](https://github.com/sanity-io/plugins/commit/59909e9ddb0261dbae585e087cd9f0af12f1e775) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): Update xstate monorepo to ^5.32.1

- [#1088](https://github.com/sanity-io/plugins/pull/1088) [`ca9dc55`](https://github.com/sanity-io/plugins/commit/ca9dc556c3a79aefea1ba613a72833d83ea4a05c) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): Update xstate monorepo to v6

## 4.0.2

## 4.0.1

### Patch Changes

- [#1047](https://github.com/sanity-io/plugins/pull/1047) [`050cc51`](https://github.com/sanity-io/plugins/commit/050cc51e260151b459dbe5d1d79d78302117210e) Thanks [@stipsan](https://github.com/stipsan)! - Fix the deployments table layout (correct "Creator" column width and table body display), surface JSON parsing errors from the Vercel API, and remove an invalid `htmlFor` attribute from a non-label description.

## 4.0.0

### Major Changes

- [#977](https://github.com/sanity-io/plugins/pull/977) [`52d3d1c`](https://github.com/sanity-io/plugins/commit/52d3d1cb2c79ae78d5d2d505e9303532e2c827e7) Thanks [@stipsan](https://github.com/stipsan)! - Port sanity-plugin-dashboard-widget-vercel to the Sanity plugins monorepo

  This major release includes several breaking changes as part of the migration to the monorepo:

  - **React Compiler enabled**: The package is now built with React Compiler targeting React 19
  - **ESM-only**: CommonJS support has been removed. The package now ships only ESM
  - **React 19.2+ required**: Minimum React version is now 19.2 (previously ^18.3 || ^19.2)
  - **Sanity Studio v5+ required**: Minimum Sanity version is now v5 (Sanity v3 and v4 are no longer supported)
  - **@sanity/dashboard v5+ required**: The `@sanity/dashboard` peer dependency range is now ^5 || ^6 (previously ^4 || ^5)
  - **Node.js 20.19+ required**: Minimum Node.js version is now 20.19 (previously >=18)
  - **@sanity/ui v3**: The widget now renders with @sanity/ui v3 and uses the v2 theme API for color properties

### Patch Changes

- Updated dependencies [[`52d3d1c`](https://github.com/sanity-io/plugins/commit/52d3d1cb2c79ae78d5d2d505e9303532e2c827e7)]:
  - @sanity/dashboard@6.0.0

## [3.1.6](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/compare/v3.1.5...v3.1.6) (2026-01-07)

### Bug Fixes

- allow `@sanity/dashboard` v5 ([afeac34](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/afeac346855e28dafe18d9a0d040d49298faf8d1))

## [3.1.5](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/compare/v3.1.4...v3.1.5) (2025-12-29)

### Bug Fixes

- **deps:** allow studio v5 in peer deps ranges ([#86](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/issues/86)) ([f894b87](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/f894b87d437369ee53c0a4cd1887b3dee318fe1f))

## [3.1.4](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/compare/v3.1.3...v3.1.4) (2025-07-10)

### Bug Fixes

- **deps:** allow studio v4 peer dep ranges ([7e883b6](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/7e883b6a505e547b6506a8a6a3ff1a94d9a32e7e))

## [3.1.3](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/compare/v3.1.2...v3.1.3) (2025-03-07)

### Bug Fixes

- **deps:** Update dependency @hookform/resolvers to v4 ([#79](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/issues/79)) ([12a250e](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/12a250ef8eb7028a075fa4dd2fc531fc5925b49a))
- **deps:** upgrade to xstate v5 ([e2b6dea](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/e2b6dea0534dd3bf10a5624696bfa46161a5bb5b))

## [3.1.2](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/compare/v3.1.1...v3.1.2) (2025-03-07)

### Bug Fixes

- **deps:** bump react-hook-form ([2a6a102](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/2a6a10264d66be9f6e440167f785a5639f241375))

## [3.1.1](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/compare/v3.1.0...v3.1.1) (2025-03-07)

### Bug Fixes

- **deps:** move to `@tanstack/react-query` ([39da485](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/39da48502235d918f6c00f4f66cc1a2ed04958dd))

## [3.1.0](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/compare/v3.0.0...v3.1.0) (2025-03-07)

### Features

- add react 19 to peer deps ([bd1d4b3](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/bd1d4b355c9b6fad1be63c04abbbd5a351a75c0e))

## [3.0.0](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/compare/v2.0.1...v3.0.0) (2025-03-07)

### ⚠ BREAKING CHANGES

- **deps:** require `@sanity/dashboard` v4
- update styled components to v6

### Bug Fixes

- **deps:** bump `@sanity/icons` to v3 ([0bc67ae](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/0bc67aebfac698d1b7d0c4a34792c94a9bf46a30))
- **deps:** require `@sanity/dashboard` v4 ([f38332f](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/f38332f14bd7e5e8aa3ad1824edabc9615cd439c))
- **deps:** upgrade to @sanity/ui v2 ([61a0945](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/61a09454e694dd235272fb818515d8276bc21cad))
- remove unnecessary `groq` dep ([95652ac](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/95652ac1bc4f62739e54f3310931ae28fbbe7d73))
- update styled components to v6 ([425f40c](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/425f40ce4ccef992ab4e8d11b0aacb4251940ab9))

## [2.0.1](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/compare/v2.0.0...v2.0.1) (2022-11-25)

### Bug Fixes

- **deps:** sanity ^3.0.0 (works with rc.3) ([7916ec7](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/7916ec76433134f3738b9ad18f73233798ac6c83))

## [2.0.0](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/compare/v1.1.1...v2.0.0) (2022-11-17)

### ⚠ BREAKING CHANGES

- this version does not work in Sanity Studio v2
- v3 version

### Features

- initial Sanity Studio v3 release ([6e93d7d](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/6e93d7db53c028df0ee20d6a2aa4e7daf406eee7))
- initial V3 version ([d73b762](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/d73b762ed8b07a696b6c422cfc977d01c28e323b))

### Bug Fixes

- compiled for sanity 3.0.0-rc.0 ([ad97473](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/ad974736f7838f9c196c90088e8e1d5863337273))
- **deps:** dev-preview.21 ([c2fe409](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/c2fe409a4476594422331bd0562c840574b41f34))
- **deps:** dev-preview.22 ([5cf5e49](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/5cf5e498e152a30cd4e2ab29dfea277b9f448807))
- **deps:** pin dependencies ([#23](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/issues/23)) ([42c4755](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/42c4755658282074d11012b92c5e4bcf76ecbc4a))
- **deps:** pkg-utils & @sanity/plugin-kit ([c36cb83](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/c36cb836066583f58b108c1c3be43d0a4ddd7494))
- **deps:** sanity 3.0.0-dev-preview.17 ([8d66211](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/8d66211eb8d5b39151f88358a80dc85be1265089))
- **deps:** update dependency object-hash to v3 ([#24](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/issues/24)) ([9620d89](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/9620d89c7b2c1a22a0c3ae9c61ce1833742c62c0))
- **deps:** update sanity-ui-pin ([#28](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/issues/28)) ([838b9e7](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/838b9e7dcdc5890bcc6b93804c03885820bab8b6))
- **docs:** use defineConfig in example ([284d2be](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/284d2be5207066a90866785d08e7907d111da4c8))
- update `peerDependencies` ([4fdb76a](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/4fdb76a61be22b9c58897c8f72c36806b9df7a55))
- v3 version ([ed8b793](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/ed8b79337dab47316efe8620f5f109edd8381d65))

## [2.0.0-v3-studio.7](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/compare/v2.0.0-v3-studio.6...v2.0.0-v3-studio.7) (2022-11-04)

### Bug Fixes

- **deps:** pkg-utils & @sanity/plugin-kit ([c36cb83](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/c36cb836066583f58b108c1c3be43d0a4ddd7494))

## [2.0.0-v3-studio.6](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/compare/v2.0.0-v3-studio.5...v2.0.0-v3-studio.6) (2022-11-04)

### Bug Fixes

- **deps:** pin dependencies ([#23](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/issues/23)) ([42c4755](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/42c4755658282074d11012b92c5e4bcf76ecbc4a))
- **deps:** update dependency object-hash to v3 ([#24](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/issues/24)) ([9620d89](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/9620d89c7b2c1a22a0c3ae9c61ce1833742c62c0))
- **deps:** update sanity-ui-pin ([#28](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/issues/28)) ([838b9e7](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/838b9e7dcdc5890bcc6b93804c03885820bab8b6))
- **docs:** use defineConfig in example ([284d2be](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/284d2be5207066a90866785d08e7907d111da4c8))
- update `peerDependencies` ([4fdb76a](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/4fdb76a61be22b9c58897c8f72c36806b9df7a55))

## [2.0.0-v3-studio.5](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/compare/v2.0.0-v3-studio.4...v2.0.0-v3-studio.5) (2022-11-03)

### Bug Fixes

- compiled for sanity 3.0.0-rc.0 ([ad97473](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/ad974736f7838f9c196c90088e8e1d5863337273))

## [2.0.0-v3-studio.4](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/compare/v2.0.0-v3-studio.3...v2.0.0-v3-studio.4) (2022-10-27)

### Bug Fixes

- **deps:** dev-preview.22 ([5cf5e49](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/5cf5e498e152a30cd4e2ab29dfea277b9f448807))

## [2.0.0-v3-studio.3](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/compare/v2.0.0-v3-studio.2...v2.0.0-v3-studio.3) (2022-10-07)

### Bug Fixes

- **deps:** dev-preview.21 ([c2fe409](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/c2fe409a4476594422331bd0562c840574b41f34))

## [2.0.0-v3-studio.2](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/compare/v2.0.0-v3-studio.1...v2.0.0-v3-studio.2) (2022-09-15)

### Bug Fixes

- **deps:** sanity 3.0.0-dev-preview.17 ([8d66211](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/8d66211eb8d5b39151f88358a80dc85be1265089))

## [2.0.0-v3-studio.1](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/compare/v1.1.1...v2.0.0-v3-studio.1) (2022-09-02)

### ⚠ BREAKING CHANGES

- v3 version

### Features

- initial V3 version ([d73b762](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/d73b762ed8b07a696b6c422cfc977d01c28e323b))

### Bug Fixes

- v3 version ([ed8b793](https://github.com/sanity-io/sanity-plugin-dashboard-widget-vercel/commit/ed8b79337dab47316efe8620f5f109edd8381d65))

### [1.1.1](https://github.com/robinpyon/sanity-plugin-dashboard-widget-vercel/compare/v1.1.0...v1.1.1) (2022-01-03)

### Bug Fixes

- correctly namespace deployment target \_ids ([cd97cd3](https://github.com/robinpyon/sanity-plugin-dashboard-widget-vercel/commit/cd97cd39bd35260efe728c796d8cbadf4d788aa6))

## [1.1.0](https://github.com/robinpyon/sanity-plugin-dashboard-widget-vercel/compare/v1.0.0...v1.1.0) (2021-03-25)

### Features

- use API-versioned client if available ([44ca27f](https://github.com/robinpyon/sanity-plugin-dashboard-widget-vercel/commit/44ca27fbd0649be8c050aad8b7eecf67324ee65d))

## [1.0.0](https://github.com/robinpyon/sanity-plugin-dashboard-widget-vercel/compare/v0.1.5...v1.0.0) (2021-03-24)

### ⚠ BREAKING CHANGES

- Deployment targets are now configured within sanity - please remove any vercel
  related configuration you may have stored inside your dashboard config file. Support for forcing
  small layout has also been (temporarily) dropped.

### Features

- store tokens in a namespaced sanity document, add support for multiple deploy targets ([a1a3446](https://github.com/robinpyon/sanity-plugin-dashboard-widget-vercel/commit/a1a34464590934f1bf7adf3812f29acbef3ed314))

### Bug Fixes

- add eventless transitions to deployment target list machine ([7a6d921](https://github.com/robinpyon/sanity-plugin-dashboard-widget-vercel/commit/7a6d921e05c238adbb335331531999a31f680b14))
- set correct form defaults, update input descriptions, include target name in deploy button ([bf10600](https://github.com/robinpyon/sanity-plugin-dashboard-widget-vercel/commit/bf106000b1a69c9f127f517da98d901fbbbcd481))

### [0.1.5](https://github.com/robinpyon/sanity-plugin-dashboard-widget-vercel/compare/v0.1.4...v0.1.5) (2021-01-23)

### [0.1.4](https://github.com/robinpyon/sanity-plugin-dashboard-widget-vercel/compare/v0.1.3...v0.1.4) (2021-01-15)

### [0.1.3](https://github.com/robinpyon/sanity-plugin-dashboard-widget-vercel/compare/v0.1.2...v0.1.3) (2020-11-23)

### Bug Fixes

- add babel plugin-transform-runtime ([7a5ad89](https://github.com/robinpyon/sanity-plugin-dashboard-widget-vercel/commit/7a5ad89b553387717017be01ee3778c641fca570))

### [0.1.2](https://github.com/robinpyon/sanity-plugin-dashboard-widget-vercel/compare/v0.1.1...v0.1.2) (2020-11-23)

### Bug Fixes

- don't return an empty array prior to aliases being fetched ([856be29](https://github.com/robinpyon/sanity-plugin-dashboard-widget-vercel/commit/856be2981a9c02362d80212f6f773669a6fd7094))

### [0.1.1](https://github.com/robinpyon/sanity-plugin-dashboard-widget-vercel/compare/v0.1.0...v0.1.1) (2020-11-21)

### Bug Fixes

- add babel preset-env ([4da6993](https://github.com/robinpyon/sanity-plugin-dashboard-widget-vercel/commit/4da69936e8158277fe9b9a77b491516e74dec4b3))

## [0.1.0](https://github.com/robinpyon/sanity-plugin-dashboard-widget-vercel/compare/v0.0.6...v0.1.0) (2020-11-21)

### [0.0.6](https://github.com/robinpyon/sanity-plugin-dashboard-widget-vercel/compare/v0.0.5...v0.0.6) (2020-11-21)

### Features

- allow deployLimit to be user configurable, minor cleanup" ([d15f4a8](https://github.com/robinpyon/sanity-plugin-dashboard-widget-vercel/commit/d15f4a8f0ffa1525cb106a2006ff61ef53c29401))

### Bug Fixes

- correctly show cancelled dot color ([5045a3d](https://github.com/robinpyon/sanity-plugin-dashboard-widget-vercel/commit/5045a3d4c9e3ba94945a97d3f1dfd5b636cf184a))

### [0.0.5](https://github.com/robinpyon/sanity-plugin-dashboard-widget-vercel/compare/v0.0.4...v0.0.5) (2020-11-20)

### Features

- make deployHook optional, show error snackbar on refresh error, add deployment skeleton" ([a24071e](https://github.com/robinpyon/sanity-plugin-dashboard-widget-vercel/commit/a24071e7ab9d44f9b1a655cb260ee0680c698617))

### [0.0.4](https://github.com/robinpyon/sanity-plugin-dashboard-widget-vercel/compare/v0.0.3...v0.0.4) (2020-11-20)

### Features

- create dedicated cell components, force cell widths, minor cleanup ([fb4b36a](https://github.com/robinpyon/sanity-plugin-dashboard-widget-vercel/commit/fb4b36a14332eb61f4f0f44484b2570a1b248418))
- display configuration error message, store config error in machine context ([e8ce270](https://github.com/robinpyon/sanity-plugin-dashboard-widget-vercel/commit/e8ce270cf74215f5419a1053426d2742d2d3eee3))

### Bug Fixes

- add delay to DEPLOYED event before forcing refresh ([cd104fc](https://github.com/robinpyon/sanity-plugin-dashboard-widget-vercel/commit/cd104fc8ba39ed601a39a7f139121106910dc3da))

### [0.0.3](https://github.com/robinpyon/sanity-plugin-dashboard-widget-vercel/compare/v0.0.2...v0.0.3) (2020-11-19)

### Features

- add initial xstate machines, use react-query ([ffff751](https://github.com/robinpyon/sanity-plugin-dashboard-widget-vercel/commit/ffff751e0167a981a3d649ce991ca9ba06a048e6))
- add xstate deploy machhine, pull config values from sanity, add run-time config checking" ([6c940cb](https://github.com/robinpyon/sanity-plugin-dashboard-widget-vercel/commit/6c940cb64d57e708f022f06840c9b9796b1d4883))

### 0.0.2 (2020-11-11)

### Features

- add commitizen, standard-release and husky ([160646c](https://github.com/robinpyon/sanity-plugin-dashboard-widget-vercel/commit/160646c73d140af6738e6ea8864e275a736a13f8))
