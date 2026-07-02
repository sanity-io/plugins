# @sanity/embeddings-index-ui

## 4.0.3

### Patch Changes

- [#1471](https://github.com/sanity-io/plugins/pull/1471) [`52487d2`](https://github.com/sanity-io/plugins/commit/52487d208f11fe2a4ccb523fab9386f3fbdd5880) Thanks [@stipsan](https://github.com/stipsan)! - Update `@sanity/icons` to v4 and adopt its per-icon import paths for smaller bundles and faster treeshaking

## 4.0.2

### Patch Changes

- [#1462](https://github.com/sanity-io/plugins/pull/1462) [`4206774`](https://github.com/sanity-io/plugins/commit/4206774bad11de60e11cd07827f288eee710e797) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency @sanity/icons to ^3.8.0

- [#1363](https://github.com/sanity-io/plugins/pull/1363) [`f9acf7c`](https://github.com/sanity-io/plugins/commit/f9acf7c0599e63feb30509f7d42ff941a01e2d35) Thanks [@stipsan](https://github.com/stipsan)! - Replace `React.forwardRef` with the React 19 ref-as-prop pattern (internal refactor, no API change)

## 4.0.1

### Patch Changes

- [#1347](https://github.com/sanity-io/plugins/pull/1347) [`fabdc72`](https://github.com/sanity-io/plugins/commit/fabdc726bb1c9abee0e16252422ebd27a3d8e428) Thanks [@stipsan](https://github.com/stipsan)! - Adopt the shared monorepo TypeScript and lint conventions (shared `@repo/tsconfig`, type-aware linting) and fix the type errors surfaced by the stricter config.

## 4.0.0

### Major Changes

- [#1192](https://github.com/sanity-io/plugins/pull/1192) [`c5988bf`](https://github.com/sanity-io/plugins/commit/c5988bf4509178eb42947dd50d8d8c90f7e41756) Thanks [@snorrees](https://github.com/snorrees)! - Port @sanity/embeddings-index-ui to the Sanity plugins monorepo

  This major release includes several breaking changes as part of the migration to the monorepo:

  - **React Compiler enabled**: The package is now built with React Compiler targeting React 19
  - **ESM-only**: CommonJS support has been removed. The package now ships only ESM
  - **React 19.2+ required**: Minimum React version is now 19.2 (previously ^18 || ^19)
  - **react-dom 19.2+ required**: `react-dom` is now a required peer dependency
  - **styled-components 6.1+ required**: `styled-components` is now a required peer dependency
  - **Sanity Studio v5+ required**: Minimum Sanity version is now v5 (Sanity v3 and v4 are no longer supported)
  - **Node.js 20.19+ required**: Minimum Node.js version is now 20.19 (previously >=18)
  - **Dropped Sanity v2 compatibility**: Removed `v2-incompatible.js` and `sanity.json`

## [3.0.1](https://github.com/sanity-io/embeddings-index-ui/compare/v3.0.0...v3.0.1) (2025-12-29)

### Bug Fixes

- update package.json and package-lock.json to support Sanity v5 ([ddff897](https://github.com/sanity-io/embeddings-index-ui/commit/ddff897c78cd32fbe7bbc4fff4538c638fc167b2))

## [3.0.0](https://github.com/sanity-io/embeddings-index-ui/compare/v2.1.1...v3.0.0) (2025-07-31)

### ⚠ BREAKING CHANGES

- **deps:** update dependency @sanity/ui to v3 (#19)

### Bug Fixes

- **deps:** update dependency @sanity/ui to v3 ([#19](https://github.com/sanity-io/embeddings-index-ui/issues/19)) ([a8d62b2](https://github.com/sanity-io/embeddings-index-ui/commit/a8d62b264c1e6d4f82af89dade8decee3c0d68b4))

## [2.1.1](https://github.com/sanity-io/embeddings-index-ui/compare/v2.1.0...v2.1.1) (2025-07-10)

### Bug Fixes

- **deps:** allow studio v4 in peer dep ranges + update main.yml ([#17](https://github.com/sanity-io/embeddings-index-ui/issues/17)) ([02b26f6](https://github.com/sanity-io/embeddings-index-ui/commit/02b26f602e2059926f1cda982aa608d0521ab848))

## [2.1.0](https://github.com/sanity-io/embeddings-index-ui/compare/v2.0.1...v2.1.0) (2025-05-02)

### Features

- adds compatability for sanity 3.80, but also requires sanity 3.80+ ([3e9ea22](https://github.com/sanity-io/embeddings-index-ui/commit/3e9ea227317e865caee0fddd0b577da266319d33))

## [2.0.1](https://github.com/sanity-io/embeddings-index-ui/compare/v2.0.0...v2.0.1) (2024-12-18)

### Bug Fixes

- flag as react 19 compatible ([#15](https://github.com/sanity-io/embeddings-index-ui/issues/15)) ([e0a5895](https://github.com/sanity-io/embeddings-index-ui/commit/e0a5895e1cfac6cbc7a5aeb4fdcfbc11a4dc94de))

## [2.0.0](https://github.com/sanity-io/embeddings-index-ui/compare/v1.1.8...v2.0.0) (2024-11-28)

### ⚠ BREAKING CHANGES

- **deps:** Update dependency @sanity/ui to v2 (#10)

### Bug Fixes

- **deps:** Update dependency @sanity/ui to v2 ([#10](https://github.com/sanity-io/embeddings-index-ui/issues/10)) ([4678435](https://github.com/sanity-io/embeddings-index-ui/commit/4678435809d43f6a2d6e239852888ffb8f71be19))

## [1.1.8](https://github.com/sanity-io/embeddings-index-ui/compare/v1.1.7...v1.1.8) (2023-10-10)

### Bug Fixes

- next esm build error ([eb4d5f2](https://github.com/sanity-io/embeddings-index-ui/commit/eb4d5f272ecadf4b271d58b89ee34145f789316b))

## [1.1.7](https://github.com/sanity-io/embeddings-index-ui/compare/v1.1.6...v1.1.7) (2023-10-09)

### Bug Fixes

- display an error dialog if feature check fails ([ab79710](https://github.com/sanity-io/embeddings-index-ui/commit/ab797104079f05d7ad97a18a70ebba128560f2f2))

## [1.1.6](https://github.com/sanity-io/embeddings-index-ui/compare/v1.1.5...v1.1.6) (2023-10-05)

### Bug Fixes

- users with read access, but without project/read grant will no longer get a missing plan feature dialog ([edcfa36](https://github.com/sanity-io/embeddings-index-ui/commit/edcfa36f4a4ccea8f5342f2eeaa10db46bbb6c58))

## [1.1.5](https://github.com/sanity-io/embeddings-index-ui/compare/v1.1.4...v1.1.5) (2023-09-15)

### Bug Fixes

- plan typo ([dd01dc7](https://github.com/sanity-io/embeddings-index-ui/commit/dd01dc73b88e5b8716c8196f527b51de2140e8e4))

## [1.1.4](https://github.com/sanity-io/embeddings-index-ui/compare/v1.1.3...v1.1.4) (2023-09-15)

### Bug Fixes

- **docs:** remove duplicate quoted notice about OpenAI and Pinecone ([8da14f0](https://github.com/sanity-io/embeddings-index-ui/commit/8da14f061b26310dcec8efa9abfa59561eee37fe))
- reworded team plan required banner ([c1569ce](https://github.com/sanity-io/embeddings-index-ui/commit/c1569ce451d2279f1d711379107ddba3ca2d28aa))

## [1.1.3](https://github.com/sanity-io/embeddings-index-ui/compare/v1.1.2...v1.1.3) (2023-09-14)

### Bug Fixes

- **docs:** update UI Readme to make it more consistent with CLI Readme ([#4](https://github.com/sanity-io/embeddings-index-ui/issues/4)) ([176a59f](https://github.com/sanity-io/embeddings-index-ui/commit/176a59faf97be5490ae0a0b1d58d7d96712a285c))

## [1.1.2](https://github.com/sanity-io/embeddings-index-ui/compare/v1.1.1...v1.1.2) (2023-09-14)

### Bug Fixes

- **docs:** added note about Sanity using openai and pinecone for this feature ([6c71a64](https://github.com/sanity-io/embeddings-index-ui/commit/6c71a64e6ce0ed2ccbfd77750ce4af4182b04a0a))

## [1.1.1](https://github.com/sanity-io/embeddings-index-ui/compare/v1.1.0...v1.1.1) (2023-09-14)

### Bug Fixes

- navigate to document when selecting it in index tool search ([f7f6d26](https://github.com/sanity-io/embeddings-index-ui/commit/f7f6d26e1a5c3ae2d8a0adfaed2e30c4faf71ba0))

## [1.1.0](https://github.com/sanity-io/embeddings-index-ui/compare/v1.0.3...v1.1.0) (2023-09-14)

### Features

- autocomplete in index tool search ([0b84d80](https://github.com/sanity-io/embeddings-index-ui/commit/0b84d80e63d1cde83856d2443c2731fdd67a7654))
- support for default index configuration ([18da837](https://github.com/sanity-io/embeddings-index-ui/commit/18da837aabcaa9b64233d16167e4aa32d562f09c))

### Bug Fixes

- adder border to index entries to invite interaction ([bd1bc64](https://github.com/sanity-io/embeddings-index-ui/commit/bd1bc64c7ee988bef390ec5e5465f32d5eb4b611))
- show filter before projection in index form ([c403917](https://github.com/sanity-io/embeddings-index-ui/commit/c4039177e6824fcea5c2936df899ea7235813e42))

## [1.0.3](https://github.com/sanity-io/embeddings-index-ui/compare/v1.0.2...v1.0.3) (2023-09-13)

### Bug Fixes

- show notice when project feature is missing ([ff3d6dc](https://github.com/sanity-io/embeddings-index-ui/commit/ff3d6dc79c3944c9a6e938ae6a3059d108d2722b))

## [1.0.2](https://github.com/sanity-io/embeddings-index-ui/compare/v1.0.1...v1.0.2) (2023-09-12)

### Bug Fixes

- custom url host via localstorage ([7ca0a13](https://github.com/sanity-io/embeddings-index-ui/commit/7ca0a132007dab02f1b0c682a6f309f4cf6fe460))

## [1.0.1](https://github.com/sanity-io/embeddings-index-ui/compare/v1.0.0...v1.0.1) (2023-09-04)

### Bug Fixes

- **docs:** typo ([0bf2215](https://github.com/sanity-io/embeddings-index-ui/commit/0bf2215eebf946e60b0af4afeda365d307b64c7e))
- send document when search is empty ([c2cdb43](https://github.com/sanity-io/embeddings-index-ui/commit/c2cdb436b5ae0a08d14bfb16ad2b039f78558134))

## 1.0.0 (2023-09-04)

### Features

- initial version ([8fac48c](https://github.com/sanity-io/embeddings-index-ui/commit/8fac48cba2405430681c43904fc1b11ffa95b761))
