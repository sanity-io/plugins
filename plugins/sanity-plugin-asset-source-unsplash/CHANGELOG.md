# sanity-plugin-asset-source-unsplash

## 7.0.21

### Patch Changes

- [#1702](https://github.com/sanity-io/plugins/pull/1702) [`2a3a7ea`](https://github.com/sanity-io/plugins/commit/2a3a7eab8616981991e4a0b345ebe866a5fec8df) Thanks [@stipsan](https://github.com/stipsan)! - Update `@sanity/ui` dependency to ^3.4.3.

## 7.0.20

### Patch Changes

- [#1684](https://github.com/sanity-io/plugins/pull/1684) [`4ea0d1f`](https://github.com/sanity-io/plugins/commit/4ea0d1fd2eeb05b80f38e11aa17ca29390115999) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Update `@sanity/icons` dependency to the latest catalog version.

- [#1684](https://github.com/sanity-io/plugins/pull/1684) [`4ea0d1f`](https://github.com/sanity-io/plugins/commit/4ea0d1fd2eeb05b80f38e11aa17ca29390115999) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Update `@sanity/ui` dependency to the latest catalog version.

## 7.0.19

### Patch Changes

- [#1622](https://github.com/sanity-io/plugins/pull/1622) [`6fe3c11`](https://github.com/sanity-io/plugins/commit/6fe3c11e32b8187a19fbdc333e4a8b159fe5a616) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.9

## 7.0.18

### Patch Changes

- [#1596](https://github.com/sanity-io/plugins/pull/1596) [`f06fd76`](https://github.com/sanity-io/plugins/commit/f06fd767531740a09a5755f41fa1d3d42da202ae) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.8

## 7.0.17

### Patch Changes

- [#1571](https://github.com/sanity-io/plugins/pull/1571) [`52975b2`](https://github.com/sanity-io/plugins/commit/52975b2f0d4ea5086c800b2ce16190b862284a95) Thanks [@stipsan](https://github.com/stipsan)! - fix(deps): update tsdown to ^0.22.7 and @sanity/tsdown-config to ^0.14.0

## 7.0.16

### Patch Changes

- [#1519](https://github.com/sanity-io/plugins/pull/1519) [`a11d511`](https://github.com/sanity-io/plugins/commit/a11d511b371b332adc08197711583951eb294166) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.5

## 7.0.15

### Patch Changes

- [#1476](https://github.com/sanity-io/plugins/pull/1476) [`b8bc962`](https://github.com/sanity-io/plugins/commit/b8bc96275b26a3d219a55cd22e3d29b27e331e11) Thanks [@stipsan](https://github.com/stipsan)! - Document intentional use of the asset source `title` property (internal change only)

## 7.0.14

### Patch Changes

- [#1491](https://github.com/sanity-io/plugins/pull/1491) [`2361892`](https://github.com/sanity-io/plugins/commit/236189294b6408c9bced43765e53cf26a11a0e66) Thanks [@stipsan](https://github.com/stipsan)! - Build with `tsdown` instead of `@sanity/pkg-utils`. Internal build-tooling change only, with no intended changes to the public API or runtime behavior.

## 7.0.13

### Patch Changes

- [#1460](https://github.com/sanity-io/plugins/pull/1460) [`f50f060`](https://github.com/sanity-io/plugins/commit/f50f0605968e5cec4f23f5f3455abe5c8ddda23c) Thanks [@stipsan](https://github.com/stipsan)! - Regenerate TypeScript declaration output: `isolatedDeclarations` is no longer used and declarations are now generated with tsgo (`@typescript/native-preview`). Internal build-tooling change only, with no runtime behavior or public API changes.

## 7.0.12

### Patch Changes

- [#1481](https://github.com/sanity-io/plugins/pull/1481) [`0eae652`](https://github.com/sanity-io/plugins/commit/0eae652abea74fd63af2d334707afc8ecd4eb15a) Thanks [@stipsan](https://github.com/stipsan)! - Upgrade `@sanity/pkg-utils` to `^10.9.0`, enabling tree-shaking of unused `styled-components` in the published bundle. Tagged template literals are now transpiled to plain call expressions during build, so bundlers can drop styled components this plugin exports but the app doesn't use, reducing bundle size.

## 7.0.11

### Patch Changes

- [#1471](https://github.com/sanity-io/plugins/pull/1471) [`52487d2`](https://github.com/sanity-io/plugins/commit/52487d208f11fe2a4ccb523fab9386f3fbdd5880) Thanks [@stipsan](https://github.com/stipsan)! - Update `@sanity/icons` to v4 and adopt its per-icon import paths for smaller bundles and faster treeshaking

## 7.0.10

### Patch Changes

- [#1083](https://github.com/sanity-io/plugins/pull/1083) [`7e65764`](https://github.com/sanity-io/plugins/commit/7e65764c026879d6156e49d8380e3bd6d85f0697) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): Update lodash monorepo to ^4.18.1

## 7.0.9

### Patch Changes

- [#1007](https://github.com/sanity-io/plugins/pull/1007) [`cfb07c2`](https://github.com/sanity-io/plugins/commit/cfb07c2e7c58d49ad81e00271e5348a3cd37a92b) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): Update dependency react-photo-album to ^3.6.0

## 7.0.8

### Patch Changes

- [#980](https://github.com/sanity-io/plugins/pull/980) [`98d148e`](https://github.com/sanity-io/plugins/commit/98d148e00ef679b422e1effe7fc53dfce9cb046c) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Update `@sanity/pkg-utils` to pick up a DTS generation bug fix.

## 7.0.7

### Patch Changes

- [#903](https://github.com/sanity-io/plugins/pull/903) [`2f03c8d`](https://github.com/sanity-io/plugins/commit/2f03c8d98039c29b9d4fd9bc6cd7c09c909c8cc4) Thanks [@bjoerge](https://github.com/bjoerge)! - Widen `sanity` peer-dependency range to `^5 || ^6.0.0-0` to support Sanity Studio v6 (including v6 pre-releases).

## 7.0.6

### Patch Changes

- [#869](https://github.com/sanity-io/plugins/pull/869) [`2a3f19d`](https://github.com/sanity-io/plugins/commit/2a3f19d835dbc75e79cce2a0ccd72b3c561170dd) Thanks [@renovate](https://github.com/apps/renovate)! - Replace deprecated `space` prop with `gap` to address @sanity/ui v3.2.0 deprecation warnings

## 7.0.5

### Patch Changes

- [#683](https://github.com/sanity-io/plugins/pull/683) [`1deccd8`](https://github.com/sanity-io/plugins/commit/1deccd816abe530766d2188393d5514ae15594b9) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - fix(deps): Update dependency react-photo-album to ^3.5.1 and add CSS type declarations

## 7.0.4

### Patch Changes

- [#624](https://github.com/sanity-io/plugins/pull/624) [`dbfe998`](https://github.com/sanity-io/plugins/commit/dbfe9982f69f173cc67bcec0a3a38ca57cd9dcb8) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Import lodash-es functions from subpaths instead of barrel export for better performance

## 7.0.3

### Patch Changes

- [`6397826`](https://github.com/sanity-io/plugins/commit/63978265fe5b46ea88b524a945d16fbf39d7c199) Thanks [@stipsan](https://github.com/stipsan)! - Improve build output and dts gen

- [#485](https://github.com/sanity-io/plugins/pull/485) [`8ef77f6`](https://github.com/sanity-io/plugins/commit/8ef77f6c5cb6132644b62eb4a4450746047fe655) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): Update dependency lodash-es to ^4.17.23

- [#463](https://github.com/sanity-io/plugins/pull/463) [`2ce1ce0`](https://github.com/sanity-io/plugins/commit/2ce1ce06fd5d0803a3a1eeb0ff4fe62b53881ae9) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Migrate from deprecated theme v0 APIs to v2 APIs using `getTheme_v2` helper

## 7.0.2

### Patch Changes

- [`d3978bc`](https://github.com/sanity-io/plugins/commit/d3978bc676286c86396d29e02b744474b3340bee) Thanks [@stipsan](https://github.com/stipsan)! - Update LICENSE year

## 7.0.1

### Patch Changes

- [#338](https://github.com/sanity-io/plugins/pull/338) [`d0da010`](https://github.com/sanity-io/plugins/commit/d0da0103b36befab880e8bb8e67b0634bc6efaef) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): Update dependency lodash-es to ^4.17.22

- [#342](https://github.com/sanity-io/plugins/pull/342) [`6538df6`](https://github.com/sanity-io/plugins/commit/6538df642cc527b5d698a9f395cbc329f7cf2af5) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): Update dependency react-photo-album to ^3.4.0

## 7.0.0

### Major Changes

- [`20c43ac`](https://github.com/sanity-io/plugins/commit/20c43ac07e632ce5d75fd8bd9a47938e377b476b) Thanks [@stipsan](https://github.com/stipsan)! - Require Sanity Studio V5

## 6.0.0

### Major Changes

- [#279](https://github.com/sanity-io/plugins/pull/279) [`717cf74`](https://github.com/sanity-io/plugins/commit/717cf7481c3deb5970120ef0be565ab66d14d91e) Thanks [@stipsan](https://github.com/stipsan)! - Require React 19.2

## 5.0.1

### Patch Changes

- [`eff3997`](https://github.com/sanity-io/plugins/commit/eff3997ed120aff6adfb0e77ef6fe67d63e92d38) Thanks [@stipsan](https://github.com/stipsan)! - Use `Component` named export instead of default React export

## 5.0.0

### Major Changes

- [#230](https://github.com/sanity-io/plugins/pull/230) [`ec9a903`](https://github.com/sanity-io/plugins/commit/ec9a903ebdc6128e455e2ec387054d98f7109aee) Thanks [@pedrobonamin](https://github.com/pedrobonamin)! - Enable React Compiler

## [4.0.1](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v4.0.0...v4.0.1) (2025-08-15)

### Bug Fixes

- export unsplash icon ([0defa1a](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/0defa1a35e99eb23573b842a2066123bb0ea4810))

## [4.0.0](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v3.1.0...v4.0.0) (2025-08-15)

### ⚠ BREAKING CHANGES

- require sanity v4

### Features

- require sanity v4 ([63136be](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/63136bea270aa002c1b5778b0d709520e26f5b57))

## [3.1.0](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v3.0.4...v3.1.0) (2025-07-29)

### Features

- **deps:** upgrade `@sanity/ui` to v3 ([fbdd83c](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/fbdd83c66fc7ee243ec2bad11dcd6781caa897e4))

## [3.0.4](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v3.0.3...v3.0.4) (2025-07-10)

### Bug Fixes

- **deps:** allow studio v4 peer dep ranges ([f2ebd6a](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/f2ebd6a7591e5efeca68278eaaf75917c07967f2))

## [3.0.3](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v3.0.2...v3.0.3) (2025-01-28)

### Bug Fixes

- improve react 19 typings ([7b87db1](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/7b87db1637b26ce71cc591df121f86ce63099a66))

## [3.0.2](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v3.0.1...v3.0.2) (2024-12-18)

### Bug Fixes

- allow react 19 ([a0ce51f](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/a0ce51f68185730932aecb3cb59ec58e29490a16))
- **deps:** Update dependency @sanity/icons to v3 ([#154](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/issues/154)) ([b9b8161](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/b9b8161dab78497134f5fd14ee930197611e8d17))

## [3.0.1](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v3.0.0...v3.0.1) (2024-04-11)

### Bug Fixes

- bump sanity ui ([09c1563](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/09c156378cf6d78a1df9ad15970217be4813efbe))
- **deps:** bump non-major ([f5e54ed](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/f5e54ed40dd75e923a1f1686fd1ccfd180ac5714))
- **deps:** Update non-major ([#141](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/issues/141)) ([6396bff](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/6396bff057558cc55b9bcd7dfde1c0cc7331500f))

## [3.0.0](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v2.0.1...v3.0.0) (2024-04-08)

### ⚠ BREAKING CHANGES

- require `styled-components` v6 (#138)

### Bug Fixes

- require `styled-components` v6 ([#138](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/issues/138)) ([044a74d](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/044a74da6cc5a7683f0e8a8eb48eae45bc424a8e))

## [2.0.1](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v2.0.0...v2.0.1) (2024-03-12)

### Bug Fixes

- improve UX of search input ([5ac85fd](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/5ac85fd06b5ce968c9ca1a09c0da283fd8d926b8))

## [2.0.0](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v1.1.2...v2.0.0) (2024-03-12)

### ⚠ BREAKING CHANGES

- update dependency @sanity/ui to v2 (#127)

### Bug Fixes

- update dependency @sanity/ui to v2 ([#127](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/issues/127)) ([a163e52](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/a163e52dac306ea5d0f67da08342bb7905f5bc32))

## [1.1.2](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v1.1.1...v1.1.2) (2023-10-23)

### Bug Fixes

- **deps:** update dependency styled-components to v6 ([13266e2](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/13266e22bd3a12941e80b9d1e62953dc6e9e3e2e))

## [1.1.1](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v1.1.0...v1.1.1) (2023-09-03)

### Bug Fixes

- **deps:** update non-major ([#112](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/issues/112)) ([19cfa89](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/19cfa89aa931d552b34e23366a2888b74ac5698f))

## [1.1.0](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v1.0.7...v1.1.0) (2023-05-23)

### Features

- improve ESM support ([284d24e](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/284d24e4847e45ad7daaa932e4e7cbc961033995))

## [1.0.7](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v1.0.6...v1.0.7) (2023-05-23)

### Bug Fixes

- **deps:** update dependencies (non-major) ([#83](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/issues/83)) ([f0d8e9a](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/f0d8e9a7501a74160c945b8aba260ab31562c2f4))
- don't steal focus from the search input ([6810a7c](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/6810a7c89609bd33dda20e728dde1b7cc87c8df7))

## [1.0.6](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v1.0.5...v1.0.6) (2023-01-12)

### Bug Fixes

- redraw unsplash logo to match the `@sanity/icons` grid ([5997b28](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/5997b2814af4c6371d3525b3210719d8293f7c7d))

## [1.0.5](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v1.0.4...v1.0.5) (2023-01-12)

### Bug Fixes

- **deps:** update dependency react-photo-album to v2 ([#68](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/issues/68)) ([4748ce0](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/4748ce0507da4239377793c2b9621f3862cb3a5f))

## [1.0.4](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v1.0.3...v1.0.4) (2023-01-12)

### Bug Fixes

- adjust unsplash logo negative space with `viewBox` instead of CSS `transform: scale` ([d10e532](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/d10e5324e3b8eef5eebd8fe03326bb7f748c9cb3))
- better deduping of shared dependencies ([6b9eff7](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/6b9eff77baf95903541526ad4df8f36086d46754))
- replace `lodash/flatten` with native `Array.flat` ([90f8c07](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/90f8c07038e9f7f0f3ef566b826be9b84e3717c4))

## [1.0.3](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v1.0.2...v1.0.3) (2023-01-04)

### Bug Fixes

- **deps:** applied npx @sanity/plugin-kit inject ([a2631da](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/a2631daaa487f4bf51a78cff304373d76ebea186))

## [1.0.2](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v1.0.1...v1.0.2) (2023-01-03)

### Bug Fixes

- **docs:** formBuilder.image.assetSource should be form.image.assetSource ([36991e6](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/36991e69334c0d6e4c77efbe848df8e3cf1e7fef))
- vertically center unsplash logo ([dfa2612](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/dfa26120d994b98f861321a59e7466da28b70486))

## [1.0.1](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v1.0.0...v1.0.1) (2022-11-25)

### Bug Fixes

- **deps:** sanity ^3.0.0 (works with rc.3) ([2c4b6de](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/2c4b6de94c99d3a058b73b4e18f7caca2d4a81dc))

## [1.0.0](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v0.2.4...v1.0.0) (2022-11-17)

### ⚠ BREAKING CHANGES

- this version does not work in Sanity Studio v2
- No longer works in Studio V3

### Features

- initial Sanity Studio v3 release ([299e0ff](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/299e0ff6975e3c5c490927c08c089067a96d3f47))
- studio v3 version ([b96bc92](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/b96bc920ddab5f8b6c7fc14992b8e85fe8781822))

### Bug Fixes

- bump to `dev-preview.22` ([d891e62](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/d891e624ef4f6dd2ac435161b5bc828b0394338f))
- compiled for sanity 3.0.0-rc.0 ([7d38147](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/7d381479e1e126db165d914e6a3f0902f5ecc9b0))
- **deps:** dev-preview.21 ([3d27d95](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/3d27d951e93520872e4096d1a7dd04dca44c630d))
- **deps:** pin dependency @sanity/ui to 1.0.0-beta.32 ([#59](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/issues/59)) ([ce459ce](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/ce459ce2a2b87fe4a827c0e3675492ee5fd4df9c))
- **deps:** pkg-utils & @sanity/plugin-kit ([09a49c0](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/09a49c021cf3573f92e895c99dd047f4fc565d4a))
- **deps:** sanity 3.0.0-dev-preview.17 ([fd846ce](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/fd846cec334a4a4e18a461e1cd2ae64271a36f54))
- **deps:** sanity/ui 0.38 ([8da5b91](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/8da5b9116316d856e766b39e8599775ed65b72c0))
- **deps:** update dependency rxjs to ^6.6.7 (v3) ([#21](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/issues/21)) ([0d323ec](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/0d323ecdee947251ea187b91278a59fa01c9c273))
- **deps:** update sanity packages to v1 (v3) (major) ([#20](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/issues/20)) ([2b1efd2](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/2b1efd2dd0de5e7ffd533678de2fe2a7321f79ac))
- replace `parcel` with `@sanity/pkg-utils` ([46988fd](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/46988fd04acf148b749b9b8d8e743405c10eff05))
- set apiVersion in useClient ([260e875](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/260e8754a9171177726463681ef555d3faab7aaa))
- styled-components is a peer dep ([d2051e2](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/d2051e27ac37ae8b3a5295b76a098aa3a897e0b1))
- update docs ([3776bbc](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/3776bbcb787f9d4e7457b9d39efe3ff05f62e794))
- use currentColor in Unsplash logo svg ([0c0b241](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/0c0b241e4ffdcdabe77a4dd807919c6fb1c8195c))
- use exact `@sanity/ui` version ([62a260c](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/62a260cab6fcfb15fb60986ffaf5b2210b31231f))
- use the same `@sanity/ui` as `dev-preview` ([156970d](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/156970d2f244a48e20a9e0712ed38a6dbafdb500))

## [3.0.0-v3-studio.13](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v3.0.0-v3-studio.12...v3.0.0-v3-studio.13) (2022-11-04)

### Bug Fixes

- **deps:** pkg-utils & @sanity/plugin-kit ([09a49c0](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/09a49c021cf3573f92e895c99dd047f4fc565d4a))

## [3.0.0-v3-studio.12](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v3.0.0-v3-studio.11...v3.0.0-v3-studio.12) (2022-11-03)

### Bug Fixes

- **deps:** pin dependency @sanity/ui to 1.0.0-beta.32 ([#59](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/issues/59)) ([ce459ce](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/ce459ce2a2b87fe4a827c0e3675492ee5fd4df9c))

## [3.0.0-v3-studio.11](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v3.0.0-v3-studio.10...v3.0.0-v3-studio.11) (2022-11-02)

### Bug Fixes

- compiled for sanity 3.0.0-rc.0 ([7d38147](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/7d381479e1e126db165d914e6a3f0902f5ecc9b0))

## [3.0.0-v3-studio.10](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v3.0.0-v3-studio.9...v3.0.0-v3-studio.10) (2022-10-25)

### Bug Fixes

- use exact `@sanity/ui` version ([62a260c](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/62a260cab6fcfb15fb60986ffaf5b2210b31231f))

## [3.0.0-v3-studio.9](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v3.0.0-v3-studio.8...v3.0.0-v3-studio.9) (2022-10-25)

### Bug Fixes

- **deps:** update dependency rxjs to ^6.6.7 (v3) ([#21](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/issues/21)) ([0d323ec](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/0d323ecdee947251ea187b91278a59fa01c9c273))
- replace `parcel` with `@sanity/pkg-utils` ([46988fd](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/46988fd04acf148b749b9b8d8e743405c10eff05))

## [3.0.0-v3-studio.8](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v3.0.0-v3-studio.7...v3.0.0-v3-studio.8) (2022-10-24)

### Bug Fixes

- bump to `dev-preview.22` ([d891e62](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/d891e624ef4f6dd2ac435161b5bc828b0394338f))

## [3.0.0-v3-studio.7](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v3.0.0-v3-studio.6...v3.0.0-v3-studio.7) (2022-10-11)

### Bug Fixes

- styled-components is a peer dep ([d2051e2](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/d2051e27ac37ae8b3a5295b76a098aa3a897e0b1))
- use the same `@sanity/ui` as `dev-preview` ([156970d](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/156970d2f244a48e20a9e0712ed38a6dbafdb500))

## [3.0.0-v3-studio.6](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v3.0.0-v3-studio.5...v3.0.0-v3-studio.6) (2022-10-07)

### Bug Fixes

- **deps:** dev-preview.21 ([3d27d95](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/3d27d951e93520872e4096d1a7dd04dca44c630d))

## [3.0.0-v3-studio.5](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v3.0.0-v3-studio.4...v3.0.0-v3-studio.5) (2022-09-15)

### Bug Fixes

- **deps:** sanity/ui 0.38 ([8da5b91](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/8da5b9116316d856e766b39e8599775ed65b72c0))

## [3.0.0-v3-studio.4](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v3.0.0-v3-studio.3...v3.0.0-v3-studio.4) (2022-09-15)

### Bug Fixes

- **deps:** sanity 3.0.0-dev-preview.17 ([fd846ce](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/fd846cec334a4a4e18a461e1cd2ae64271a36f54))
- set apiVersion in useClient ([260e875](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/260e8754a9171177726463681ef555d3faab7aaa))

# [3.0.0-v3-studio.3](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v3.0.0-v3-studio.2...v3.0.0-v3-studio.3) (2022-08-17)

### Bug Fixes

- update docs ([3776bbc](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/3776bbcb787f9d4e7457b9d39efe3ff05f62e794))

# [3.0.0-v3-studio.2](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v3.0.0-v3-studio.1...v3.0.0-v3-studio.2) (2022-08-17)

### Bug Fixes

- **deps:** update sanity packages to v1 (v3) (major) ([#20](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/issues/20)) ([2b1efd2](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/2b1efd2dd0de5e7ffd533678de2fe2a7321f79ac))

# [3.0.0-v3-studio.1](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v3.0.0-v3-studio.0...v3.0.0-v3-studio.1) (2022-08-17)

### Bug Fixes

- use currentColor in Unsplash logo svg ([0c0b241](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/0c0b241e4ffdcdabe77a4dd807919c6fb1c8195c))

# [1.0.0-v3-studio.1](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v0.2.1...v1.0.0-v3-studio.1) (2022-08-17)

- feat!: studio v3 version ([b96bc92](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/b96bc920ddab5f8b6c7fc14992b8e85fe8781822))

### BREAKING CHANGES

- No longer works in Studio V3

### [0.2.2](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/compare/v0.2.1...v0.2.2) (2022-05-05)

### Features

- v3 upgrade ([e3d1bdb](https://github.com/sanity-io/sanity-plugin-asset-source-unsplash/commit/e3d1bdbb38a8764e0cf89f6e61feb9e06cf0379d))
