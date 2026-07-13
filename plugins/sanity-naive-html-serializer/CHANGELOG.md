# sanity-naive-html-serializer

## 5.1.9

### Patch Changes

- [#1519](https://github.com/sanity-io/plugins/pull/1519) [`a11d511`](https://github.com/sanity-io/plugins/commit/a11d511b371b332adc08197711583951eb294166) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.5

## 5.1.8

### Patch Changes

- [#1476](https://github.com/sanity-io/plugins/pull/1476) [`b8bc962`](https://github.com/sanity-io/plugins/commit/b8bc96275b26a3d219a55cd22e3d29b27e331e11) Thanks [@stipsan](https://github.com/stipsan)! - Remove redundant type assertions in block deserialization (internal refactor, no API change)

## 5.1.7

### Patch Changes

- [#1491](https://github.com/sanity-io/plugins/pull/1491) [`2361892`](https://github.com/sanity-io/plugins/commit/236189294b6408c9bced43765e53cf26a11a0e66) Thanks [@stipsan](https://github.com/stipsan)! - Build with `tsdown` instead of `@sanity/pkg-utils`. Internal build-tooling change only, with no intended changes to the public API or runtime behavior.

## 5.1.6

### Patch Changes

- [#1460](https://github.com/sanity-io/plugins/pull/1460) [`f50f060`](https://github.com/sanity-io/plugins/commit/f50f0605968e5cec4f23f5f3455abe5c8ddda23c) Thanks [@stipsan](https://github.com/stipsan)! - Regenerate TypeScript declaration output: `isolatedDeclarations` is no longer used and declarations are now generated with tsgo (`@typescript/native-preview`). Internal build-tooling change only, with no runtime behavior or public API changes.

## 5.1.5

### Patch Changes

- [`953cbf5`](https://github.com/sanity-io/plugins/commit/953cbf5c06d7c8a5191ee8534fa0d871b8f7cf0c) Thanks [@stipsan](https://github.com/stipsan)! - Use type-only imports for type references to satisfy `verbatimModuleSyntax`

## 5.1.4

### Patch Changes

- [#1299](https://github.com/sanity-io/plugins/pull/1299) [`eaa6280`](https://github.com/sanity-io/plugins/commit/eaa6280d729f6e3b4436e7b2fc2556b4580e4afe) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency @portabletext/block-tools to ^5.1.5

- [#1345](https://github.com/sanity-io/plugins/pull/1345) [`c6e8859`](https://github.com/sanity-io/plugins/commit/c6e88593379d8890246f212fb12916f3b99f78d5) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency @portabletext/block-tools to ^5.1.6

## 5.1.3

### Patch Changes

- [#1002](https://github.com/sanity-io/plugins/pull/1002) [`a57034d`](https://github.com/sanity-io/plugins/commit/a57034d68067548b6366f0f6b2478e1ab4e79875) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): Update dependency @portabletext/to-html to v4

- [#998](https://github.com/sanity-io/plugins/pull/998) [`f63f575`](https://github.com/sanity-io/plugins/commit/f63f5755a25584af6ac41b7f2ef466eb8318584a) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): Update dependency @portabletext/block-tools to v5

- [#999](https://github.com/sanity-io/plugins/pull/999) [`143b038`](https://github.com/sanity-io/plugins/commit/143b0384c48e01d7417676f35a23b23c212a8dce) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): Update dependency @portabletext/to-html to v5

## 5.1.2

### Patch Changes

- [#980](https://github.com/sanity-io/plugins/pull/980) [`98d148e`](https://github.com/sanity-io/plugins/commit/98d148e00ef679b422e1effe7fc53dfce9cb046c) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Update `@sanity/pkg-utils` to pick up a DTS generation bug fix.

## 5.1.1

### Patch Changes

- [#964](https://github.com/sanity-io/plugins/pull/964) [`4226408`](https://github.com/sanity-io/plugins/commit/4226408594d2717cf2503866f5d5216991701d38) Thanks [@stipsan](https://github.com/stipsan)! - Update `@sanity/mutator`, `@sanity/schema`, and `@sanity/util` dependencies to v6, in line with Sanity Studio v6

## 5.1.0

### Minor Changes

- [#957](https://github.com/sanity-io/plugins/pull/957) [`310b5fe`](https://github.com/sanity-io/plugins/commit/310b5fe3070eafe89f3cafea48568a3577a3a118) Thanks [@pedrobonamin](https://github.com/pedrobonamin)! - Support both internationalized array data formats. The serializer, deserializer, and merger now read the language from either the legacy `_key` or the new `language` field (`sanity-plugin-internationalized-array` v5), and write merged translations back in whichever format the source document already uses.

## 5.0.0

### Major Changes

- [#931](https://github.com/sanity-io/plugins/pull/931) [`5a9204f`](https://github.com/sanity-io/plugins/commit/5a9204fcf31f00eb5c96c1368ab21cef088cf8f4) Thanks [@pedrobonamin](https://github.com/pedrobonamin)! - Port sanity-naive-html-serializer to the Sanity plugins monorepo

  This major release includes several breaking changes as part of the migration to the monorepo:

  - **React Compiler enabled**: The package is now built with React Compiler targeting React 19
  - **ESM-only**: CommonJS support has been removed. The package now ships only ESM
  - **React 19.2+ required**: Minimum React version is now 19.2 (previously ^18.3 || ^19)
  - **react-dom 19.2+ required**: `react-dom` is now a required peer dependency
  - **Sanity Studio v5+ required**: Minimum Sanity version is now v5 (Sanity v3 and v4 are no longer supported)
  - **Node.js 20.19+ required**: Minimum Node.js version is now 20.19 (previously >=18)

## [4.1.0](https://github.com/sanity-io/sanity-naive-html-serializer/compare/v4.0.2...v4.1.0) (2026-02-08)

### Features

- i18n array serialization ([#62](https://github.com/sanity-io/sanity-naive-html-serializer/issues/62)) ([174ded7](https://github.com/sanity-io/sanity-naive-html-serializer/commit/174ded7a31948758aaa1897014941c1373970388))

## [4.0.2](https://github.com/sanity-io/sanity-naive-html-serializer/compare/v4.0.1...v4.0.2) (2025-12-29)

### Bug Fixes

- **deps:** allow studio v5 in peer deps ranges ([#92](https://github.com/sanity-io/sanity-naive-html-serializer/issues/92)) ([7e4b4c0](https://github.com/sanity-io/sanity-naive-html-serializer/commit/7e4b4c03565cc33d0ed8d8241b33ad07de97daab))
- **deps:** Update dependency @portabletext/block-tools to v4 ([#89](https://github.com/sanity-io/sanity-naive-html-serializer/issues/89)) ([a277cdd](https://github.com/sanity-io/sanity-naive-html-serializer/commit/a277cddbb6a7b6c1c8d3adb9b91b6990af72d8d3))

## [4.0.1](https://github.com/sanity-io/sanity-naive-html-serializer/compare/v4.0.0...v4.0.1) (2025-11-12)

### Bug Fixes

- **deps:** update sanity monorepo to v4 ([#88](https://github.com/sanity-io/sanity-naive-html-serializer/issues/88)) ([e756db1](https://github.com/sanity-io/sanity-naive-html-serializer/commit/e756db1cb3483a1facada76f84434ef280495b25))

## [4.0.0](https://github.com/sanity-io/sanity-naive-html-serializer/compare/v3.2.0...v4.0.0) (2025-11-03)

### ⚠ BREAKING CHANGES

- Requires Node.js >=18. Updated from @sanity/block-tools to @portabletext/block-tools.

### Miscellaneous Chores

- upgrade to plugin-kit v3 and pkg-utils v8 ([#84](https://github.com/sanity-io/sanity-naive-html-serializer/issues/84)) ([5f1c214](https://github.com/sanity-io/sanity-naive-html-serializer/commit/5f1c214b89873301e8bb0f90878335e508dd47e0))

## [3.2.0](https://github.com/sanity-io/sanity-naive-html-serializer/compare/v3.1.9...v3.2.0) (2025-07-10)

### Features

- **deps:** bump all non-major ([1440591](https://github.com/sanity-io/sanity-naive-html-serializer/commit/14405912cc8adf353bc9a1f1c0e49057e2d4b7f2))

## [3.1.9](https://github.com/sanity-io/sanity-naive-html-serializer/compare/v3.1.8...v3.1.9) (2025-07-10)

### Bug Fixes

- **deps:** allow studio v4 peer dep ranges ([5b9936a](https://github.com/sanity-io/sanity-naive-html-serializer/commit/5b9936a7b43645b4e98ec6e11155799a4e1d85bb))
- **deps:** update React dependency to v19 ([#78](https://github.com/sanity-io/sanity-naive-html-serializer/issues/78)) ([d3fd193](https://github.com/sanity-io/sanity-naive-html-serializer/commit/d3fd1939c7d3ccccabf321415e936816f5bbefad))
