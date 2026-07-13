# sanity-plugin-workspace-home

## 3.0.12

### Patch Changes

- [#1519](https://github.com/sanity-io/plugins/pull/1519) [`a11d511`](https://github.com/sanity-io/plugins/commit/a11d511b371b332adc08197711583951eb294166) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.5

## 3.0.11

### Patch Changes

- [#1491](https://github.com/sanity-io/plugins/pull/1491) [`2361892`](https://github.com/sanity-io/plugins/commit/236189294b6408c9bced43765e53cf26a11a0e66) Thanks [@stipsan](https://github.com/stipsan)! - Build with `tsdown` instead of `@sanity/pkg-utils`. Internal build-tooling change only, with no intended changes to the public API or runtime behavior.

## 3.0.10

### Patch Changes

- [#1460](https://github.com/sanity-io/plugins/pull/1460) [`f50f060`](https://github.com/sanity-io/plugins/commit/f50f0605968e5cec4f23f5f3455abe5c8ddda23c) Thanks [@stipsan](https://github.com/stipsan)! - Regenerate TypeScript declaration output: `isolatedDeclarations` is no longer used and declarations are now generated with tsgo (`@typescript/native-preview`). Internal build-tooling change only, with no runtime behavior or public API changes.

## 3.0.9

### Patch Changes

- [#1481](https://github.com/sanity-io/plugins/pull/1481) [`0eae652`](https://github.com/sanity-io/plugins/commit/0eae652abea74fd63af2d334707afc8ecd4eb15a) Thanks [@stipsan](https://github.com/stipsan)! - Upgrade `@sanity/pkg-utils` to `^10.9.0`, enabling tree-shaking of unused `styled-components` in the published bundle. Tagged template literals are now transpiled to plain call expressions during build, so bundlers can drop styled components this plugin exports but the app doesn't use, reducing bundle size.

## 3.0.8

### Patch Changes

- [#1471](https://github.com/sanity-io/plugins/pull/1471) [`52487d2`](https://github.com/sanity-io/plugins/commit/52487d208f11fe2a4ccb523fab9386f3fbdd5880) Thanks [@stipsan](https://github.com/stipsan)! - Update `@sanity/icons` to v4 and adopt its per-icon import paths for smaller bundles and faster treeshaking

## 3.0.7

### Patch Changes

- [#980](https://github.com/sanity-io/plugins/pull/980) [`98d148e`](https://github.com/sanity-io/plugins/commit/98d148e00ef679b422e1effe7fc53dfce9cb046c) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Update `@sanity/pkg-utils` to pick up a DTS generation bug fix.

## 3.0.6

### Patch Changes

- [#903](https://github.com/sanity-io/plugins/pull/903) [`2f03c8d`](https://github.com/sanity-io/plugins/commit/2f03c8d98039c29b9d4fd9bc6cd7c09c909c8cc4) Thanks [@bjoerge](https://github.com/bjoerge)! - Widen `sanity` peer-dependency range to `^5 || ^6.0.0-0` to support Sanity Studio v6 (including v6 pre-releases).

## 3.0.5

### Patch Changes

- [#869](https://github.com/sanity-io/plugins/pull/869) [`2a3f19d`](https://github.com/sanity-io/plugins/commit/2a3f19d835dbc75e79cce2a0ccd72b3c561170dd) Thanks [@renovate](https://github.com/apps/renovate)! - Replace deprecated `space` prop with `gap`, `columns` with `gridTemplateColumns`, and `columnStart`/`columnEnd` with `gridColumnStart`/`gridColumnEnd` to address @sanity/ui v3.2.0 deprecation warnings

## 3.0.4

### Patch Changes

- [`6397826`](https://github.com/sanity-io/plugins/commit/63978265fe5b46ea88b524a945d16fbf39d7c199) Thanks [@stipsan](https://github.com/stipsan)! - Improve build output and dts gen

## 3.0.3

### Patch Changes

- [`d3978bc`](https://github.com/sanity-io/plugins/commit/d3978bc676286c86396d29e02b744474b3340bee) Thanks [@stipsan](https://github.com/stipsan)! - Update LICENSE year

## 3.0.2

### Patch Changes

- [`61bd460`](https://github.com/sanity-io/plugins/commit/61bd46026d73147b9f8a51a82fba186927327c4e) Thanks [@stipsan](https://github.com/stipsan)! - Improve dts output

## 3.0.1

### Patch Changes

- [`764cf28`](https://github.com/sanity-io/plugins/commit/764cf281176986d009e7ec8d32e5fa050ca20edb) Thanks [@stipsan](https://github.com/stipsan)! - Remove `react-compiler-runtime` dep

## 3.0.0

### Major Changes

- [`20c43ac`](https://github.com/sanity-io/plugins/commit/20c43ac07e632ce5d75fd8bd9a47938e377b476b) Thanks [@stipsan](https://github.com/stipsan)! - Require Sanity Studio V5

## 2.0.3

### Patch Changes

- [`69a8d2f`](https://github.com/sanity-io/plugins/commit/69a8d2f8ce1e8f5b342e7066dbc79a20b6687abe) Thanks [@stipsan](https://github.com/stipsan)! - Declare support for Studio v5

## 2.0.2

### Patch Changes

- [`45ed942`](https://github.com/sanity-io/plugins/commit/45ed942824ab4316d88bf7c49641164643ea519c) Thanks [@stipsan](https://github.com/stipsan)! - Use babel-plugin-styled-components to optimize styled components

## 2.0.1

### Patch Changes

- [#130](https://github.com/sanity-io/plugins/pull/130) [`4399a30`](https://github.com/sanity-io/plugins/commit/4399a3093607d330942791e2f23981906cb8b56d) Thanks [@stipsan](https://github.com/stipsan)! - Improve quality of generated dts

## 2.0.0

### Major Changes

- [#71](https://github.com/sanity-io/plugins/pull/71) [`592405b`](https://github.com/sanity-io/plugins/commit/592405b091dc5d24e947dcef326c219c401443a2) Thanks [@stipsan](https://github.com/stipsan)! - Require Sanity Studio v4 or later

- [#71](https://github.com/sanity-io/plugins/pull/71) [`592405b`](https://github.com/sanity-io/plugins/commit/592405b091dc5d24e947dcef326c219c401443a2) Thanks [@stipsan](https://github.com/stipsan)! - Remove CJS, this package is now ESM-only

### Minor Changes

- [#71](https://github.com/sanity-io/plugins/pull/71) [`592405b`](https://github.com/sanity-io/plugins/commit/592405b091dc5d24e947dcef326c219c401443a2) Thanks [@stipsan](https://github.com/stipsan)! - Add React Compiler

### Patch Changes

- [#71](https://github.com/sanity-io/plugins/pull/71) [`592405b`](https://github.com/sanity-io/plugins/commit/592405b091dc5d24e947dcef326c219c401443a2) Thanks [@stipsan](https://github.com/stipsan)! - The `@sanity/ui` dependency is now a regular dependency instead of a peer

- [#71](https://github.com/sanity-io/plugins/pull/71) [`592405b`](https://github.com/sanity-io/plugins/commit/592405b091dc5d24e947dcef326c219c401443a2) Thanks [@stipsan](https://github.com/stipsan)! - The `react-is` dependency is now a regular dependency instead of inlined

## [1.1.3](https://github.com/sanity-io/sanity-plugin-workspace-home/compare/v1.1.2...v1.1.3) (2025-10-03)

### Bug Fixes

- use named styled import ([61cc938](https://github.com/sanity-io/sanity-plugin-workspace-home/commit/61cc9383d81e71bb841d1699ffbd34e1a8b271f8))

## [1.1.2](https://github.com/sanity-io/sanity-plugin-workspace-home/compare/v1.1.1...v1.1.2) (2025-07-10)

### Bug Fixes

- **deps:** allow studio v4 in peer dep ranges ([#9](https://github.com/sanity-io/sanity-plugin-workspace-home/issues/9)) ([ba44b63](https://github.com/sanity-io/sanity-plugin-workspace-home/commit/ba44b63268d94e2c5944fb87b7a34173056e5035))

## [1.1.1](https://github.com/sanity-io/sanity-plugin-workspace-home/compare/v1.1.0...v1.1.1) (2024-10-15)

### Bug Fixes

- adjust height of surrounding card ([2dd76dd](https://github.com/sanity-io/sanity-plugin-workspace-home/commit/2dd76dd157702b3bffd3d836739d92e144b9a343))
- config type ([90a8d37](https://github.com/sanity-io/sanity-plugin-workspace-home/commit/90a8d37c6c933ebf9df3bdf161d0e3834cabf469))
- truncate text instead of overflow ([464d028](https://github.com/sanity-io/sanity-plugin-workspace-home/commit/464d02824a179f5d6a4f0f4996c27c378abd72bb))

## [1.1.0](https://github.com/sanity-io/sanity-plugin-workspace-home/compare/v1.0.0...v1.1.0) (2023-03-23)

### Features

- new search filter ([97c999e](https://github.com/sanity-io/sanity-plugin-workspace-home/commit/97c999e61b8a22437a8657017e782d3a5f079b79))

## 1.0.0 (2023-03-22)

### Bug Fixes

- prep for release ([b3ac3d7](https://github.com/sanity-io/sanity-plugin-workspace-home/commit/b3ac3d7ef22fe91c62aaa0d6b2161c4f4fb31e33))
