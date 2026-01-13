# @sanity/rich-date-input

## 4.0.2

### Patch Changes

- [`c06778e`](https://github.com/sanity-io/plugins/commit/c06778e2acf304bdb7b57a306edca11eaeeb8800) Thanks [@stipsan](https://github.com/stipsan)! - Fix crash on `sanity@5.3.0`

## 4.0.1

### Patch Changes

- [#395](https://github.com/sanity-io/plugins/pull/395) [`ea217b7`](https://github.com/sanity-io/plugins/commit/ea217b7e6d3b3483b2216972b3e746e1d073c2dc) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): Update dependency @sanity/icons to ^3.7.4

- [#396](https://github.com/sanity-io/plugins/pull/396) [`f9d7bcf`](https://github.com/sanity-io/plugins/commit/f9d7bcf4fad8eac7a89e9bc5fdb4123a1fa552a2) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): Update dependency @vvo/tzdb to ^6.198.0

## 4.0.0

### Major Changes

- [#392](https://github.com/sanity-io/plugins/pull/392) [`3e095e0`](https://github.com/sanity-io/plugins/commit/3e095e07461204f68a0427ebb7184816dc6f0e56) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Migrate plugin to monorepo with React Compiler support, ESM-only, and Sanity Studio v5 baseline.

  ## Breaking Changes
  - **ESM-only**: This package now ships as ESM-only. CommonJS (CJS) is no longer supported.
  - **Sanity Studio v5 baseline**: The minimum required version of Sanity Studio is now v5.
  - **React 19**: Peer dependency updated to React 19.2.
  - **React Compiler enabled**: The plugin is now compiled with React Compiler for optimized performance.

  ## Migration Guide

  If you're upgrading from v3.x:
  1. Ensure your project is using Sanity Studio v5 or later
  2. Ensure your project is using React 19.2 or later
  3. No code changes required - the API remains the same

## <small>3.0.8 (2025-12-29)</small>

- fix: update package.json and package-lock.json to support Sanity v5 (#29) ([cb042fd](https://github.com/sanity-io/rich-date-input/commit/cb042fd)), closes [#29](https://github.com/sanity-io/rich-date-input/issues/29)

## <small>3.0.7 (2025-12-05)</small>

- fix: add additional group check for timezone value (#21) ([2f34fa4](https://github.com/sanity-io/rich-date-input/commit/2f34fa4)), closes [#21](https://github.com/sanity-io/rich-date-input/issues/21)
- fix: calculate offset dynamically for DST transitions in date display (#26) ([c606a8e](https://github.com/sanity-io/rich-date-input/commit/c606a8e)), closes [#26](https://github.com/sanity-io/rich-date-input/issues/26)
- fix: fix value offset for lint (#28) ([755bf9a](https://github.com/sanity-io/rich-date-input/commit/755bf9a)), closes [#28](https://github.com/sanity-io/rich-date-input/issues/28)
- fix: remove the double label caused by datetimeinput now including its own one (#24) ([99292d6](https://github.com/sanity-io/rich-date-input/commit/99292d6)), closes [#24](https://github.com/sanity-io/rich-date-input/issues/24)
- chore: audit fix deps (#27) ([3662b3d](https://github.com/sanity-io/rich-date-input/commit/3662b3d)), closes [#27](https://github.com/sanity-io/rich-date-input/issues/27)
- Update README.md ([841a93e](https://github.com/sanity-io/rich-date-input/commit/841a93e))

## [3.0.6](https://github.com/sanity-io/rich-date-input/compare/v3.0.5...v3.0.6) (2025-07-10)

### Bug Fixes

- **deps:** allow studio v4 in peer dep ranges + update main.yml ([#22](https://github.com/sanity-io/rich-date-input/issues/22)) ([4c9899f](https://github.com/sanity-io/rich-date-input/commit/4c9899fa19946670552a24b5c1e3963c11ed78c4))

## [3.0.5](https://github.com/sanity-io/rich-date-input/compare/v3.0.4...v3.0.5) (2024-12-18)

### Bug Fixes

- make react 19 compatible ([#19](https://github.com/sanity-io/rich-date-input/issues/19)) ([6a55154](https://github.com/sanity-io/rich-date-input/commit/6a551547b79977be1570d2b639f6fbd68f018222))

## [3.0.4](https://github.com/sanity-io/rich-date-input/compare/v3.0.3...v3.0.4) (2024-07-18)

### Bug Fixes

- recalculate offsets for possible DST effects ([#13](https://github.com/sanity-io/rich-date-input/issues/13)) ([5d97007](https://github.com/sanity-io/rich-date-input/commit/5d97007f0ab5efa129c7b9ca916e80bee10d91fe))

## [3.0.3](https://github.com/sanity-io/rich-date-input/compare/v3.0.2...v3.0.3) (2024-06-26)

### Bug Fixes

- **deps:** update deps ([df987ff](https://github.com/sanity-io/rich-date-input/commit/df987ffd8c8eba590782bae6151a229c7868a317))

## [3.0.2](https://github.com/sanity-io/rich-date-input/compare/v3.0.1...v3.0.2) (2024-06-26)

### Bug Fixes

- add missing peer dependency `date-fns` ([9aecf00](https://github.com/sanity-io/rich-date-input/commit/9aecf00400ff26d2e114e824a8248d4eea5fb9a8))

## [3.0.1](https://github.com/sanity-io/rich-date-input/compare/v3.0.0...v3.0.1) (2024-04-14)

### Bug Fixes

- refer to group names for timezone selection as well ([#7](https://github.com/sanity-io/rich-date-input/issues/7)) ([e543f11](https://github.com/sanity-io/rich-date-input/commit/e543f1138703d547b6a56aaf2f4a5e7ad4ffa326))

## 1.0.0 (2023-11-21)

### ⚠ BREAKING CHANGES

- upgrade to v3 (#5)

### Features

- upgrade to v3 ([#5](https://github.com/sanity-io/rich-date-input/issues/5)) ([3893ded](https://github.com/sanity-io/rich-date-input/commit/3893dedf3de4d84312320202e318efcd0a2d4959))
