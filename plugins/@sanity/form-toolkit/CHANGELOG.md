# @sanity/form-toolkit

## 3.0.17

### Patch Changes

- [#1928](https://github.com/sanity-io/plugins/pull/1928) [`3195e01`](https://github.com/sanity-io/plugins/commit/3195e01b3adffe32e03cb0d65da00b091e18ce89) Thanks [@stipsan](https://github.com/stipsan)! - Compile React Compiler memoization with the native oxc transform (`reactCompiler: {transform: 'oxc'}` from `@sanity/tsdown-config` 0.26, backed by `oxc-transform-react`) instead of `babel-plugin-react-compiler`

- Updated dependencies [[`3195e01`](https://github.com/sanity-io/plugins/commit/3195e01b3adffe32e03cb0d65da00b091e18ce89)]:
  - @sanity/sanity-plugin-async-list@3.0.4

## 3.0.16

### Patch Changes

- Updated dependencies [[`c30892f`](https://github.com/sanity-io/plugins/commit/c30892f91ce0e048dae59c395b998dddcc843b43), [`f485d93`](https://github.com/sanity-io/plugins/commit/f485d934bfcb46ac873c66c6332d760815d797dd)]:
  - @sanity/sanity-plugin-async-list@3.0.3

## 3.0.15

### Patch Changes

- [#1881](https://github.com/sanity-io/plugins/pull/1881) [`440c499`](https://github.com/sanity-io/plugins/commit/440c4997cb74daab0e375519275f42a234f8a76e) Thanks [@stipsan](https://github.com/stipsan)! - Update @sanity/ui to ^4.0.1

- Updated dependencies [[`440c499`](https://github.com/sanity-io/plugins/commit/440c4997cb74daab0e375519275f42a234f8a76e)]:
  - @sanity/sanity-plugin-async-list@3.0.2

## 3.0.14

### Patch Changes

- [#1793](https://github.com/sanity-io/plugins/pull/1793) [`0650099`](https://github.com/sanity-io/plugins/commit/0650099886e58486f958b7d5318333bba5b7aff8) Thanks [@stipsan](https://github.com/stipsan)! - upgrade to `@sanity/ui` v4

- Updated dependencies [[`0650099`](https://github.com/sanity-io/plugins/commit/0650099886e58486f958b7d5318333bba5b7aff8)]:
  - @sanity/sanity-plugin-async-list@3.0.1

## 3.0.13

### Patch Changes

- [#1234](https://github.com/sanity-io/plugins/pull/1234) [`1dd36c8`](https://github.com/sanity-io/plugins/commit/1dd36c84acb5f9485afe2fd2e04639aebec023d4) Thanks [@stipsan](https://github.com/stipsan)! - Address post-migration review feedback:

  - `FormRenderer` now renders interactive (uncontrolled) inputs when no `getFieldState` is provided, so the documented native HTML form usage works out of the box
  - Uncontrolled text and textarea fields honor `options.defaultValue` (controlled fields keep form-library state only, so UI and submit values stay in sync)
  - `FormRenderer` falls back to `field.name` for the React key when a field has no `_key`
  - The shared HubSpot/Mailchimp request handler defaults to the Next.js-compatible handler instead of throwing when no framework environment variable is detected, and short-circuits CORS preflight (`OPTIONS`) requests
  - Corrected the `formSchema`, `formiumInput`, and `mailchimpInput` usage examples (import paths and required options), README typos, and example/dev-workflow references

- Updated dependencies [[`f4e7fcc`](https://github.com/sanity-io/plugins/commit/f4e7fcceec4adb5f049aaffce0e1d6d1585828e5)]:
  - @sanity/sanity-plugin-async-list@3.0.0

## 3.0.12

### Patch Changes

- [#1702](https://github.com/sanity-io/plugins/pull/1702) [`2a3a7ea`](https://github.com/sanity-io/plugins/commit/2a3a7eab8616981991e4a0b345ebe866a5fec8df) Thanks [@stipsan](https://github.com/stipsan)! - Update `@sanity/ui` dependency to ^3.4.3.

- Updated dependencies [[`2a3a7ea`](https://github.com/sanity-io/plugins/commit/2a3a7eab8616981991e4a0b345ebe866a5fec8df)]:
  - @sanity/sanity-plugin-async-list@2.0.12

## 3.0.11

### Patch Changes

- [#1684](https://github.com/sanity-io/plugins/pull/1684) [`4ea0d1f`](https://github.com/sanity-io/plugins/commit/4ea0d1fd2eeb05b80f38e11aa17ca29390115999) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Update `@sanity/ui` dependency to the latest catalog version.

- Updated dependencies [[`4ea0d1f`](https://github.com/sanity-io/plugins/commit/4ea0d1fd2eeb05b80f38e11aa17ca29390115999), [`4ea0d1f`](https://github.com/sanity-io/plugins/commit/4ea0d1fd2eeb05b80f38e11aa17ca29390115999)]:
  - @sanity/sanity-plugin-async-list@2.0.11

## 3.0.10

### Patch Changes

- [#1622](https://github.com/sanity-io/plugins/pull/1622) [`6fe3c11`](https://github.com/sanity-io/plugins/commit/6fe3c11e32b8187a19fbdc333e4a8b159fe5a616) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.9

- Updated dependencies [[`6fe3c11`](https://github.com/sanity-io/plugins/commit/6fe3c11e32b8187a19fbdc333e4a8b159fe5a616)]:
  - @sanity/sanity-plugin-async-list@2.0.10

## 3.0.9

### Patch Changes

- [#1596](https://github.com/sanity-io/plugins/pull/1596) [`f06fd76`](https://github.com/sanity-io/plugins/commit/f06fd767531740a09a5755f41fa1d3d42da202ae) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.8

- Updated dependencies [[`f06fd76`](https://github.com/sanity-io/plugins/commit/f06fd767531740a09a5755f41fa1d3d42da202ae)]:
  - @sanity/sanity-plugin-async-list@2.0.9

## 3.0.8

### Patch Changes

- [#1571](https://github.com/sanity-io/plugins/pull/1571) [`52975b2`](https://github.com/sanity-io/plugins/commit/52975b2f0d4ea5086c800b2ce16190b862284a95) Thanks [@stipsan](https://github.com/stipsan)! - fix(deps): update tsdown to ^0.22.7 and @sanity/tsdown-config to ^0.14.0

- Updated dependencies [[`52975b2`](https://github.com/sanity-io/plugins/commit/52975b2f0d4ea5086c800b2ce16190b862284a95)]:
  - @sanity/sanity-plugin-async-list@2.0.8

## 3.0.7

### Patch Changes

- [#1486](https://github.com/sanity-io/plugins/pull/1486) [`b15e4f5`](https://github.com/sanity-io/plugins/commit/b15e4f52fa59cfb96ef027ab636ebae77c21f1a0) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency react-icons to ^5.7.0

- [#1519](https://github.com/sanity-io/plugins/pull/1519) [`a11d511`](https://github.com/sanity-io/plugins/commit/a11d511b371b332adc08197711583951eb294166) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.5

- Updated dependencies [[`a11d511`](https://github.com/sanity-io/plugins/commit/a11d511b371b332adc08197711583951eb294166)]:
  - @sanity/sanity-plugin-async-list@2.0.7

## 3.0.6

### Patch Changes

- Updated dependencies []:
  - @sanity/sanity-plugin-async-list@2.0.6

## 3.0.5

### Patch Changes

- [#1491](https://github.com/sanity-io/plugins/pull/1491) [`2361892`](https://github.com/sanity-io/plugins/commit/236189294b6408c9bced43765e53cf26a11a0e66) Thanks [@stipsan](https://github.com/stipsan)! - Build with `tsdown` instead of `@sanity/pkg-utils`. Internal build-tooling change only, with no intended changes to the public API or runtime behavior.

- Updated dependencies [[`2361892`](https://github.com/sanity-io/plugins/commit/236189294b6408c9bced43765e53cf26a11a0e66)]:
  - @sanity/sanity-plugin-async-list@2.0.5

## 3.0.4

### Patch Changes

- [#1460](https://github.com/sanity-io/plugins/pull/1460) [`f50f060`](https://github.com/sanity-io/plugins/commit/f50f0605968e5cec4f23f5f3455abe5c8ddda23c) Thanks [@stipsan](https://github.com/stipsan)! - Regenerate TypeScript declaration output: `isolatedDeclarations` is no longer used and declarations are now generated with tsgo (`@typescript/native-preview`). Internal build-tooling change only, with no runtime behavior or public API changes.

- Updated dependencies [[`f50f060`](https://github.com/sanity-io/plugins/commit/f50f0605968e5cec4f23f5f3455abe5c8ddda23c)]:
  - @sanity/sanity-plugin-async-list@2.0.4

## 3.0.3

### Patch Changes

- Updated dependencies [[`0eae652`](https://github.com/sanity-io/plugins/commit/0eae652abea74fd63af2d334707afc8ecd4eb15a)]:
  - @sanity/sanity-plugin-async-list@2.0.3

## 3.0.2

### Patch Changes

- Updated dependencies [[`52487d2`](https://github.com/sanity-io/plugins/commit/52487d208f11fe2a4ccb523fab9386f3fbdd5880)]:
  - @sanity/sanity-plugin-async-list@2.0.2

## 3.0.1

### Patch Changes

- [#1313](https://github.com/sanity-io/plugins/pull/1313) [`ec872c6`](https://github.com/sanity-io/plugins/commit/ec872c6bc0d63b4f6d9622b7c5d39c4aec1b3661) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency h3 to ^1.15.11

- [#1322](https://github.com/sanity-io/plugins/pull/1322) [`cf18f90`](https://github.com/sanity-io/plugins/commit/cf18f90835a7a6e3e1ce1009c8e620e5ee34ebab) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency react-icons to ^5.6.0

## 3.0.0

### Major Changes

- [#972](https://github.com/sanity-io/plugins/pull/972) [`6eddbe8`](https://github.com/sanity-io/plugins/commit/6eddbe84cfebe64a20c6a91e65f3baf771919de6) Thanks [@ChrisLaRocque](https://github.com/ChrisLaRocque), [@RitaDias](https://github.com/RitaDias), [@nkgentile](https://github.com/nkgentile), [@KJHeartbreaker](https://github.com/KJHeartbreaker), [@bjoerge](https://github.com/bjoerge)! - Port @sanity/form-toolkit to the Sanity plugins monorepo

  This major release includes several breaking changes as part of the migration to the monorepo:

  - **React Compiler enabled**: The package is now built with React Compiler targeting React 19
  - **ESM-only**: CommonJS support has been removed. The package now ships only ESM
  - **React 19.2+ required**: Minimum React version is now 19.2 (previously ^18 || ^19)
  - **react-dom 19.2+ required**: `react-dom` is now a required peer dependency
  - **Sanity Studio v5+ required**: Minimum Sanity version is now v5 (Sanity v3 and v4 are no longer supported)
  - **Node.js 20.19+ required**: Minimum Node.js version is now 20.19 (previously >=18)
  - **Removed unused dependencies**: `@sanity/icons`, `react-hook-form`, and `react-rx` are no longer dependencies of this package. Install them directly if you relied on them transitively
  - **Sanity v2 compatibility shim removed**: `@sanity/incompatible-plugin`, `v2-incompatible.js`, and `sanity.json` are no longer shipped

## [2.2.3](https://github.com/sanity-io/form-toolkit/compare/v2.2.2...v2.2.3) (2025-12-29)

### Bug Fixes

- **deps:** allow studio v5 in peer deps ranges ([c532238](https://github.com/sanity-io/form-toolkit/commit/c532238b2fa319074ea5ee76ca6de343068ac002))

## [2.2.2](https://github.com/sanity-io/form-toolkit/compare/v2.2.1...v2.2.2) (2025-07-10)

### Bug Fixes

- **deps:** allow studio v4 in peer dep ranges + update main.yml ([#12](https://github.com/sanity-io/form-toolkit/issues/12)) ([a45f3a2](https://github.com/sanity-io/form-toolkit/commit/a45f3a2c3c27e4b680114c9ef99d45be69aea828))

## [2.2.1](https://github.com/sanity-io/form-toolkit/compare/v2.2.0...v2.2.1) (2025-05-12)

### Bug Fixes

- allow no options ([#11](https://github.com/sanity-io/form-toolkit/issues/11)) ([a2b6c6d](https://github.com/sanity-io/form-toolkit/commit/a2b6c6d4bfdfbce404fb3a9c879aabeea599a7fd))

## [2.2.0](https://github.com/sanity-io/form-toolkit/compare/v2.1.0...v2.2.0) (2025-05-11)

### Features

- custom form fields ([#10](https://github.com/sanity-io/form-toolkit/issues/10)) ([cde7efc](https://github.com/sanity-io/form-toolkit/commit/cde7efce92dd21683e1b3f5db2ac2b9a77020261))

## [2.1.0](https://github.com/sanity-io/form-toolkit/compare/v2.0.0...v2.1.0) (2025-03-18)

### Features

- adds submit button as component option ([#9](https://github.com/sanity-io/form-toolkit/issues/9)) ([409bf46](https://github.com/sanity-io/form-toolkit/commit/409bf46b8fb9b285f4719d9e4106fc9689a7f4b6))

## [2.0.0](https://github.com/sanity-io/form-toolkit/compare/v1.2.1...v2.0.0) (2025-03-15)

### ⚠ BREAKING CHANGES

- Import provider-specific plugin and helpers from provider export.

- chore: merge in main

- fix: match original exports

- fix: remove root types

### Features

- use provider-specific exports ([#7](https://github.com/sanity-io/form-toolkit/issues/7)) ([511d22a](https://github.com/sanity-io/form-toolkit/commit/511d22a9a639708d895124e950e80ec27d5d11f3))

## [1.2.1](https://github.com/sanity-io/form-toolkit/compare/v1.2.0...v1.2.1) (2025-03-03)

### Bug Fixes

- formdata react error ([#8](https://github.com/sanity-io/form-toolkit/issues/8)) ([467442a](https://github.com/sanity-io/form-toolkit/commit/467442a21c34c10ae2e14343a34e08dde833addb))

## [1.2.0](https://github.com/sanity-io/form-toolkit/compare/v1.1.0...v1.2.0) (2025-02-03)

### Features

- release ([1307b28](https://github.com/sanity-io/form-toolkit/commit/1307b2863a5c93da14a5ccd1935848036966e73a))

## [1.1.0](https://github.com/sanity-io/form-toolkit/compare/v1.0.0...v1.1.0) (2025-01-28)

### Features

- rename ([c8ebbf5](https://github.com/sanity-io/form-toolkit/commit/c8ebbf5805988fd8067b5dea570a37371a9134b9))

### Bug Fixes

- gh urls ([a28b352](https://github.com/sanity-io/form-toolkit/commit/a28b3527f309e01b1b6b099af2d90ce1df360960))

## 1.0.0 (2025-01-22)

### Features

- adds semver ([#5](https://github.com/sanity-io/sanity-plugin-form-toolkit/issues/5)) ([8527556](https://github.com/sanity-io/sanity-plugin-form-toolkit/commit/8527556f956a5d439d624d5b4fbb788325ce41f1))
