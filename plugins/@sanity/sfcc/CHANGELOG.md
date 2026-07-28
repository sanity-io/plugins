# @sanity/sfcc

## 1.0.24

### Patch Changes

- [#1702](https://github.com/sanity-io/plugins/pull/1702) [`2a3a7ea`](https://github.com/sanity-io/plugins/commit/2a3a7eab8616981991e4a0b345ebe866a5fec8df) Thanks [@stipsan](https://github.com/stipsan)! - Update `@sanity/ui` dependency to ^3.4.3.

## 1.0.23

### Patch Changes

- [#1684](https://github.com/sanity-io/plugins/pull/1684) [`4ea0d1f`](https://github.com/sanity-io/plugins/commit/4ea0d1fd2eeb05b80f38e11aa17ca29390115999) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Update `@sanity/icons` dependency to the latest catalog version.

- [#1684](https://github.com/sanity-io/plugins/pull/1684) [`4ea0d1f`](https://github.com/sanity-io/plugins/commit/4ea0d1fd2eeb05b80f38e11aa17ca29390115999) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Update `@sanity/ui` dependency to the latest catalog version.

## 1.0.22

## 1.0.21

### Patch Changes

- [#1622](https://github.com/sanity-io/plugins/pull/1622) [`6fe3c11`](https://github.com/sanity-io/plugins/commit/6fe3c11e32b8187a19fbdc333e4a8b159fe5a616) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.9

## 1.0.20

### Patch Changes

- [#1596](https://github.com/sanity-io/plugins/pull/1596) [`f06fd76`](https://github.com/sanity-io/plugins/commit/f06fd767531740a09a5755f41fa1d3d42da202ae) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.8

## 1.0.19

### Patch Changes

- [#1571](https://github.com/sanity-io/plugins/pull/1571) [`52975b2`](https://github.com/sanity-io/plugins/commit/52975b2f0d4ea5086c800b2ce16190b862284a95) Thanks [@stipsan](https://github.com/stipsan)! - fix(deps): update tsdown to ^0.22.7 and @sanity/tsdown-config to ^0.14.0

## 1.0.18

### Patch Changes

- [#1519](https://github.com/sanity-io/plugins/pull/1519) [`a11d511`](https://github.com/sanity-io/plugins/commit/a11d511b371b332adc08197711583951eb294166) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.5

## 1.0.17

## 1.0.16

## 1.0.15

### Patch Changes

- [#1491](https://github.com/sanity-io/plugins/pull/1491) [`2361892`](https://github.com/sanity-io/plugins/commit/236189294b6408c9bced43765e53cf26a11a0e66) Thanks [@stipsan](https://github.com/stipsan)! - Build with `tsdown` instead of `@sanity/pkg-utils`. Internal build-tooling change only, with no intended changes to the public API or runtime behavior.

## 1.0.14

### Patch Changes

- [#1460](https://github.com/sanity-io/plugins/pull/1460) [`f50f060`](https://github.com/sanity-io/plugins/commit/f50f0605968e5cec4f23f5f3455abe5c8ddda23c) Thanks [@stipsan](https://github.com/stipsan)! - Regenerate TypeScript declaration output: `isolatedDeclarations` is no longer used and declarations are now generated with tsgo (`@typescript/native-preview`). Internal build-tooling change only, with no runtime behavior or public API changes.

## 1.0.13

## 1.0.12

### Patch Changes

- [#1481](https://github.com/sanity-io/plugins/pull/1481) [`0eae652`](https://github.com/sanity-io/plugins/commit/0eae652abea74fd63af2d334707afc8ecd4eb15a) Thanks [@stipsan](https://github.com/stipsan)! - Upgrade `@sanity/pkg-utils` to `^10.9.0`, enabling tree-shaking of unused `styled-components` in the published bundle. Tagged template literals are now transpiled to plain call expressions during build, so bundlers can drop styled components this plugin exports but the app doesn't use, reducing bundle size.

## 1.0.11

### Patch Changes

- [#1471](https://github.com/sanity-io/plugins/pull/1471) [`52487d2`](https://github.com/sanity-io/plugins/commit/52487d208f11fe2a4ccb523fab9386f3fbdd5880) Thanks [@stipsan](https://github.com/stipsan)! - Update `@sanity/icons` to v4 and adopt its per-icon import paths for smaller bundles and faster treeshaking

## 1.0.10

### Patch Changes

- [#1363](https://github.com/sanity-io/plugins/pull/1363) [`f9acf7c`](https://github.com/sanity-io/plugins/commit/f9acf7c0599e63feb30509f7d42ff941a01e2d35) Thanks [@stipsan](https://github.com/stipsan)! - Replace `React.forwardRef` with the React 19 ref-as-prop pattern. `SfccDocumentStatus` is now a plain function component; it still accepts a `ref` as before.

## 1.0.9

## 1.0.8

## 1.0.7

### Patch Changes

- [#1014](https://github.com/sanity-io/plugins/pull/1014) [`c463249`](https://github.com/sanity-io/plugins/commit/c463249aa0d7b9d7b81f9378cf28c24eeefaa986) Thanks [@renovate](https://github.com/apps/renovate)! - Relax structure helper typing to avoid lint type conflicts when consuming SFCC structure builders in other workspaces.

## 1.0.6

### Patch Changes

- [#980](https://github.com/sanity-io/plugins/pull/980) [`98d148e`](https://github.com/sanity-io/plugins/commit/98d148e00ef679b422e1effe7fc53dfce9cb046c) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Update `@sanity/pkg-utils` to pick up a DTS generation bug fix.

## 1.0.5

## 1.0.4

## 1.0.3

### Patch Changes

- [#903](https://github.com/sanity-io/plugins/pull/903) [`2f03c8d`](https://github.com/sanity-io/plugins/commit/2f03c8d98039c29b9d4fd9bc6cd7c09c909c8cc4) Thanks [@bjoerge](https://github.com/bjoerge)! - Widen `sanity` peer-dependency range to `^5 || ^6.0.0-0` to support Sanity Studio v6 (including v6 pre-releases).

## 1.0.2

### Patch Changes

- [#869](https://github.com/sanity-io/plugins/pull/869) [`2a3f19d`](https://github.com/sanity-io/plugins/commit/2a3f19d835dbc75e79cce2a0ccd72b3c561170dd) Thanks [@renovate](https://github.com/apps/renovate)! - Replace deprecated `space` prop with `gap` to address @sanity/ui v3.2.0 deprecation warnings

## 1.0.1

## 1.0.0

### Major Changes

- [#794](https://github.com/sanity-io/plugins/pull/794) [`2bfbf43`](https://github.com/sanity-io/plugins/commit/2bfbf4361476878d61096842cb344a860b91c92b) Thanks [@thebiggianthead](https://github.com/thebiggianthead)! - Initial release of SFCC Sanity plugin
