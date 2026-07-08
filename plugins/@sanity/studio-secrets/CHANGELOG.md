# @sanity/studio-secrets

## 4.0.8

### Patch Changes

- [#1493](https://github.com/sanity-io/plugins/pull/1493) [`1a6465d`](https://github.com/sanity-io/plugins/commit/1a6465d2548e8fe8b034f58b89a905a6ad74bd3a) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency react-rx to ^4.2.3

## 4.0.7

### Patch Changes

- [#1491](https://github.com/sanity-io/plugins/pull/1491) [`2361892`](https://github.com/sanity-io/plugins/commit/236189294b6408c9bced43765e53cf26a11a0e66) Thanks [@stipsan](https://github.com/stipsan)! - Build with `tsdown` instead of `@sanity/pkg-utils`. Internal build-tooling change only, with no intended changes to the public API or runtime behavior.

## 4.0.6

### Patch Changes

- [#1460](https://github.com/sanity-io/plugins/pull/1460) [`f50f060`](https://github.com/sanity-io/plugins/commit/f50f0605968e5cec4f23f5f3455abe5c8ddda23c) Thanks [@stipsan](https://github.com/stipsan)! - Regenerate TypeScript declaration output: `isolatedDeclarations` is no longer used and declarations are now generated with tsgo (`@typescript/native-preview`). Internal build-tooling change only, with no runtime behavior or public API changes.

## 4.0.5

### Patch Changes

- [#980](https://github.com/sanity-io/plugins/pull/980) [`98d148e`](https://github.com/sanity-io/plugins/commit/98d148e00ef679b422e1effe7fc53dfce9cb046c) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Update `@sanity/pkg-utils` to pick up a DTS generation bug fix.

## 4.0.4

### Patch Changes

- [#903](https://github.com/sanity-io/plugins/pull/903) [`2f03c8d`](https://github.com/sanity-io/plugins/commit/2f03c8d98039c29b9d4fd9bc6cd7c09c909c8cc4) Thanks [@bjoerge](https://github.com/bjoerge)! - Widen `sanity` peer-dependency range to `^5 || ^6.0.0-0` to support Sanity Studio v6 (including v6 pre-releases).

## 4.0.3

### Patch Changes

- [#869](https://github.com/sanity-io/plugins/pull/869) [`2a3f19d`](https://github.com/sanity-io/plugins/commit/2a3f19d835dbc75e79cce2a0ccd72b3c561170dd) Thanks [@renovate](https://github.com/apps/renovate)! - Replace deprecated `space` prop with `gap` to address @sanity/ui v3.2.0 deprecation warnings

## 4.0.2

### Patch Changes

- [#685](https://github.com/sanity-io/plugins/pull/685) [`8f5f8c8`](https://github.com/sanity-io/plugins/commit/8f5f8c83eb4acd2f75be73becf6efeed5b567d8f) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Move `rxjs` and `react-rx` from `peerDependencies` to `dependencies`

## 4.0.1

### Patch Changes

- [#578](https://github.com/sanity-io/plugins/pull/578) [`ba57c53`](https://github.com/sanity-io/plugins/commit/ba57c536beea395d2652677aeb8055615a5c7cba) Thanks [@RitaDias](https://github.com/RitaDias)! - Fixed SSE listener leak in `useSecrets` hook. Previously, every component using `useSecrets` created its own SSE listener connection, causing connections to accumulate over a session (observed: 11 connections where 1 is sufficient). The hook now deduplicates listeners using RxJS `share()` so all components subscribing to the same namespace share a single SSE connection. Also fixes a race condition where a slow initial fetch could overwrite a newer value delivered by the SSE listener.

## 4.0.0

### Major Changes

- [#568](https://github.com/sanity-io/plugins/pull/568) [`f49588a`](https://github.com/sanity-io/plugins/commit/f49588a397a5c9c655272efc6085d697f44d7083) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Port @sanity/studio-secrets plugin to the plugins monorepo

  **Breaking Changes:**

  - Require React 19 and Sanity Studio v5
  - Drop CJS output, ESM only
  - Enable React Compiler

  **Code Modernization:**

  - Fixed TypeScript linting issues for strict type checking
  - Fixed floating promises with proper void operator usage
  - Replaced deprecated `React.FormEvent` with `ChangeEvent`
  - Replaced `JSX.Element` return type with `ReactElement`
  - Removed eslint-disable comments (oxlint does not require them)
  - Updated `@sanity/ui` to v3.1.11

### Patch Changes

- [#575](https://github.com/sanity-io/plugins/pull/575) [`94e6c7a`](https://github.com/sanity-io/plugins/commit/94e6c7ab36016e3a5f306dfbe4025f5e9b766dc0) Thanks [@RitaDias](https://github.com/RitaDias)! - test(studio-secrets): add comprehensive test suite for Settings and useSecrets

## [3.0.3](https://github.com/sanity-io/sanity-studio-secrets/compare/v3.0.2...v3.0.3) (2025-12-18)

### Bug Fixes

- **deps:** make peer dependencies include sanity 5.x ([#23](https://github.com/sanity-io/sanity-studio-secrets/issues/23)) ([24060cc](https://github.com/sanity-io/sanity-studio-secrets/commit/24060cc27fb5de5fea62e925f6ce7b2b6a3b2353))

## [3.0.2](https://github.com/sanity-io/sanity-studio-secrets/compare/v3.0.1...v3.0.2) (2025-07-10)

### Bug Fixes

- **deps:** allow studio v4 in peer dep ranges ([#22](https://github.com/sanity-io/sanity-studio-secrets/issues/22)) ([185ec8b](https://github.com/sanity-io/sanity-studio-secrets/commit/185ec8bb5604abb49b91661b620fe073ffe55b36))

## [3.0.1](https://github.com/sanity-io/sanity-studio-secrets/compare/v3.0.0...v3.0.1) (2024-12-17)

### Bug Fixes

- support react 19 ([#21](https://github.com/sanity-io/sanity-studio-secrets/issues/21)) ([acd1406](https://github.com/sanity-io/sanity-studio-secrets/commit/acd1406664d6ae760c207f3c85ff555db16a78ae))

## [3.0.0](https://github.com/sanity-io/sanity-studio-secrets/compare/v2.0.2...v3.0.0) (2024-04-25)

### ⚠ BREAKING CHANGES

- support `@sanity/ui` v2, and ship modern ESM (#16)

### Features

- support `@sanity/ui` v2, and ship modern ESM ([#16](https://github.com/sanity-io/sanity-studio-secrets/issues/16)) ([cc7d60a](https://github.com/sanity-io/sanity-studio-secrets/commit/cc7d60abc959cc46d18d0e1b8cbddb3bf22e776e))

## [2.0.2](https://github.com/sanity-io/sanity-studio-secrets/compare/v2.0.1...v2.0.2) (2022-11-25)

### Bug Fixes

- **deps:** sanity ^3.0.0 (rc.3 compatible) ([f332be9](https://github.com/sanity-io/sanity-studio-secrets/commit/f332be965b008a9a8872666f6f89585d73fcad44))

## [2.0.1](https://github.com/sanity-io/sanity-studio-secrets/compare/v2.0.0...v2.0.1) (2022-11-15)

### Bug Fixes

- **docs:** removed tag from install command ([e0ad28e](https://github.com/sanity-io/sanity-studio-secrets/commit/e0ad28e200fd10dcb142b36a0abaf42447b5e0c1))

## [2.0.0](https://github.com/sanity-io/sanity-studio-secrets/compare/v1.0.0...v2.0.0) (2022-11-15)

### ⚠ BREAKING CHANGES

- this version of @sanity/studio-secrets only works in sanity v3
- package is now named @sanity/secrets instead of sanity-secrets

### Features

- initial sanity V3 release ([6e2c730](https://github.com/sanity-io/sanity-studio-secrets/commit/6e2c730d4ed3d8f69cecf7f14a879d4dee55f750))
- initial v3 version ([e0b4e59](https://github.com/sanity-io/sanity-studio-secrets/commit/e0b4e59ea64de8b993cb4272d064a382341f6c76))
- renamed package to @sanity/secrets ([6fb61e4](https://github.com/sanity-io/sanity-studio-secrets/commit/6fb61e45610d72976e1aefe5ed08d7141f7884ea))

### Bug Fixes

- compiled for sanity 3.0.0-rc.0 ([2b012f8](https://github.com/sanity-io/sanity-studio-secrets/commit/2b012f8c33a4bd14296c2038f55c1b4898434617))
- compiled for sanity 3.0.0-rc.2 ([2e5b8e7](https://github.com/sanity-io/sanity-studio-secrets/commit/2e5b8e7c39328346d3dbcefefacf8eb1ebf52315))
- corrected storeSecret key ([96f95f1](https://github.com/sanity-io/sanity-studio-secrets/commit/96f95f1c6f23f2f977f53b1827262cdd9a2ef1e1))
- **deps:** pkg-utils & @sanity/plugin-kit ([5bd94d5](https://github.com/sanity-io/sanity-studio-secrets/commit/5bd94d55b9369044e7a841d6300021af2f3fa7ca))
- **docs:** corrected install command ([dd8bfdc](https://github.com/sanity-io/sanity-studio-secrets/commit/dd8bfdcf219f0b1680524f7cc7b71ecdaffcc84c))
- **docs:** use correct package name in README.md ([191246b](https://github.com/sanity-io/sanity-studio-secrets/commit/191246b76eea70a11f97e5f29f08f514ac8eb4c1))
- fallback to empty value in key editor ([11a0456](https://github.com/sanity-io/sanity-studio-secrets/commit/11a0456f61b683deb8b3608cab443a50f0babbb2))
- **release:** v3 release ([4d94493](https://github.com/sanity-io/sanity-studio-secrets/commit/4d944930b33b9b4aa16a124c948a2224550395f2))
- renamed package to @sanity/studio-secrets ([0a5aa16](https://github.com/sanity-io/sanity-studio-secrets/commit/0a5aa16d19ec2f3962a9b757af3c011fdcd3b3e5))

## [2.0.0-v3-studio.8](https://github.com/sanity-io/sanity-studio-secrets/compare/v2.0.0-v3-studio.7...v2.0.0-v3-studio.8) (2022-11-04)

### Bug Fixes

- **deps:** pkg-utils & @sanity/plugin-kit ([5bd94d5](https://github.com/sanity-io/sanity-studio-secrets/commit/5bd94d55b9369044e7a841d6300021af2f3fa7ca))

## [2.0.0-v3-studio.7](https://github.com/sanity-io/sanity-studio-secrets/compare/v2.0.0-v3-studio.6...v2.0.0-v3-studio.7) (2022-11-03)

### Bug Fixes

- compiled for sanity 3.0.0-rc.0 ([2b012f8](https://github.com/sanity-io/sanity-studio-secrets/commit/2b012f8c33a4bd14296c2038f55c1b4898434617))

## [2.0.0-v3-studio.6](https://github.com/sanity-io/sanity-studio-secrets/compare/v2.0.0-v3-studio.5...v2.0.0-v3-studio.6) (2022-10-31)

### Bug Fixes

- **docs:** use correct package name in README.md ([191246b](https://github.com/sanity-io/sanity-studio-secrets/commit/191246b76eea70a11f97e5f29f08f514ac8eb4c1))

## [2.0.0-v3-studio.5](https://github.com/sanity-io/sanity-studio-secrets/compare/v2.0.0-v3-studio.4...v2.0.0-v3-studio.5) (2022-10-31)

### Bug Fixes

- renamed package to @sanity/studio-secrets ([0a5aa16](https://github.com/sanity-io/sanity-studio-secrets/commit/0a5aa16d19ec2f3962a9b757af3c011fdcd3b3e5))

## [2.0.0-v3-studio.4](https://github.com/sanity-io/sanity-studio-secrets/compare/v2.0.0-v3-studio.3...v2.0.0-v3-studio.4) (2022-10-30)

### Bug Fixes

- fallback to empty value in key editor ([11a0456](https://github.com/sanity-io/sanity-studio-secrets/commit/11a0456f61b683deb8b3608cab443a50f0babbb2))

## [2.0.0-v3-studio.3](https://github.com/sanity-io/sanity-studio-secrets/compare/v2.0.0-v3-studio.2...v2.0.0-v3-studio.3) (2022-10-30)

### Bug Fixes

- corrected storeSecret key ([96f95f1](https://github.com/sanity-io/sanity-studio-secrets/commit/96f95f1c6f23f2f977f53b1827262cdd9a2ef1e1))

## [2.0.0-v3-studio.2](https://github.com/sanity-io/sanity-studio-secrets/compare/v2.0.0-v3-studio.1...v2.0.0-v3-studio.2) (2022-10-28)

### Bug Fixes

- **docs:** corrected install command ([dd8bfdc](https://github.com/sanity-io/sanity-studio-secrets/commit/dd8bfdcf219f0b1680524f7cc7b71ecdaffcc84c))

## [2.0.0-v3-studio.1](https://github.com/sanity-io/sanity-studio-secrets/compare/v1.1.0-v3-studio.1...v2.0.0-v3-studio.1) (2022-10-28)

### ⚠ BREAKING CHANGES

- package is now named @sanity/secrets instead of sanity-secrets

### Features

- renamed package to @sanity/secrets ([6fb61e4](https://github.com/sanity-io/sanity-studio-secrets/commit/6fb61e45610d72976e1aefe5ed08d7141f7884ea))

### Bug Fixes

- **release:** v3 release ([4d94493](https://github.com/sanity-io/sanity-studio-secrets/commit/4d944930b33b9b4aa16a124c948a2224550395f2))

## [1.1.0-v3-studio.1](https://github.com/sanity-io/sanity-studio-secrets/compare/v1.0.0...v1.1.0-v3-studio.1) (2022-10-28)

### Features

- initial v3 version ([e0b4e59](https://github.com/sanity-io/sanity-studio-secrets/commit/e0b4e59ea64de8b993cb4272d064a382341f6c76))
