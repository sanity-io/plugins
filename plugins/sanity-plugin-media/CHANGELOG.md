# sanity-plugin-media

## 6.0.0

### Major Changes

- [#1560](https://github.com/sanity-io/plugins/pull/1560) [`c270307`](https://github.com/sanity-io/plugins/commit/c270307ace6fa6fd0bb615aa68352ed6fd3d7a52) Thanks [@stipsan](https://github.com/stipsan)! - Enable React Compiler

  The package is now built with React Compiler targeting React 19, so published components are memoized automatically. As a result the `react` and `react-dom` peer dependencies are tightened from `^18.3 || ^19` to `^19.2`, since the compiled output relies on `react/compiler-runtime`. In practice this doesn't drop any supported setup: the `sanity` peer dependency (`^5 || ^6.0.0-0`) already requires React 19.2.

## 5.0.13

### Patch Changes

- [#1555](https://github.com/sanity-io/plugins/pull/1555) [`5ade159`](https://github.com/sanity-io/plugins/commit/5ade159d97951a87867d225b72d6008cdc5e7fd6) Thanks [@stipsan](https://github.com/stipsan)! - fix(deps): update sanity monorepo to ^6.4.0

## 5.0.12

### Patch Changes

- [#1518](https://github.com/sanity-io/plugins/pull/1518) [`aff509d`](https://github.com/sanity-io/plugins/commit/aff509d2c83722b2fd06d482840fb5be7fdbb1bc) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency react-virtuoso to ^4.18.10

- [#1519](https://github.com/sanity-io/plugins/pull/1519) [`a11d511`](https://github.com/sanity-io/plugins/commit/a11d511b371b332adc08197711583951eb294166) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.5

- [#1547](https://github.com/sanity-io/plugins/pull/1547) [`78c04b4`](https://github.com/sanity-io/plugins/commit/78c04b45aa830c3fb6337da7cc81ac23b0626a22) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency react-hook-form to ^7.81.0

## 5.0.11

### Patch Changes

- [#1476](https://github.com/sanity-io/plugins/pull/1476) [`b8bc962`](https://github.com/sanity-io/plugins/commit/b8bc96275b26a3d219a55cd22e3d29b27e331e11) Thanks [@stipsan](https://github.com/stipsan)! - Replace redundant type assertions with `satisfies` checks and return type annotations (internal refactor, no API change)

## 5.0.10

### Patch Changes

- [#1491](https://github.com/sanity-io/plugins/pull/1491) [`2361892`](https://github.com/sanity-io/plugins/commit/236189294b6408c9bced43765e53cf26a11a0e66) Thanks [@stipsan](https://github.com/stipsan)! - Build with `tsdown` instead of `@sanity/pkg-utils`. Internal build-tooling change only, with no intended changes to the public API or runtime behavior.

## 5.0.9

### Patch Changes

- [#1460](https://github.com/sanity-io/plugins/pull/1460) [`f50f060`](https://github.com/sanity-io/plugins/commit/f50f0605968e5cec4f23f5f3455abe5c8ddda23c) Thanks [@stipsan](https://github.com/stipsan)! - Regenerate TypeScript declaration output: `isolatedDeclarations` is no longer used and declarations are now generated with tsgo (`@typescript/native-preview`). Internal build-tooling change only, with no runtime behavior or public API changes.

## 5.0.8

### Patch Changes

- [#1481](https://github.com/sanity-io/plugins/pull/1481) [`0eae652`](https://github.com/sanity-io/plugins/commit/0eae652abea74fd63af2d334707afc8ecd4eb15a) Thanks [@stipsan](https://github.com/stipsan)! - Upgrade `@sanity/pkg-utils` to `^10.9.0`, enabling tree-shaking of unused `styled-components` in the published bundle. Tagged template literals are now transpiled to plain call expressions during build, so bundlers can drop styled components this plugin exports but the app doesn't use, reducing bundle size.

## 5.0.7

### Patch Changes

- [#1474](https://github.com/sanity-io/plugins/pull/1474) [`555ef6e`](https://github.com/sanity-io/plugins/commit/555ef6e1de0a3ae72bc584f5755c0bd325db1303) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency typescript to v6

- [#1471](https://github.com/sanity-io/plugins/pull/1471) [`52487d2`](https://github.com/sanity-io/plugins/commit/52487d208f11fe2a4ccb523fab9386f3fbdd5880) Thanks [@stipsan](https://github.com/stipsan)! - Update `@sanity/icons` to v4 and adopt its per-icon import paths for smaller bundles and faster treeshaking

## 5.0.6

### Patch Changes

- [#1457](https://github.com/sanity-io/plugins/pull/1457) [`a45f0bb`](https://github.com/sanity-io/plugins/commit/a45f0bbebcdf87f3fed0e9f72a48e4487c8020cb) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update sanity monorepo to ^6.3.0

- [#1363](https://github.com/sanity-io/plugins/pull/1363) [`f9acf7c`](https://github.com/sanity-io/plugins/commit/f9acf7c0599e63feb30509f7d42ff941a01e2d35) Thanks [@stipsan](https://github.com/stipsan)! - Replace `React.forwardRef` with the React 19 ref-as-prop pattern (internal refactor, no API change)

## 5.0.5

### Patch Changes

- [#1432](https://github.com/sanity-io/plugins/pull/1432) [`3575908`](https://github.com/sanity-io/plugins/commit/3575908bed86a22f435d4fb22442af95be9e6e29) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency nanoid to ^5.1.16

- [#1447](https://github.com/sanity-io/plugins/pull/1447) [`c202da0`](https://github.com/sanity-io/plugins/commit/c202da049e6e6bfa1bc1a25c74a7471e35235eca) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency react-virtuoso to ^4.18.9

- [#1451](https://github.com/sanity-io/plugins/pull/1451) [`71f8620`](https://github.com/sanity-io/plugins/commit/71f8620ddb285f29a0d27ceb746c52cfb73acf8e) Thanks [@stipsan](https://github.com/stipsan)! - Remove `react-is` from peerDependencies to satisfy `@sanity/pkg-utils` validation

## 5.0.4

### Patch Changes

- [#1404](https://github.com/sanity-io/plugins/pull/1404) [`9c78e97`](https://github.com/sanity-io/plugins/commit/9c78e974ed51eceedf08110b9e9a30ec6772d64b) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update sanity monorepo to ^6.2.0

## 5.0.3

### Patch Changes

- [#1396](https://github.com/sanity-io/plugins/pull/1396) [`6e30c3c`](https://github.com/sanity-io/plugins/commit/6e30c3c6d454cb05e08b23dcc7cba7c8b7c8e72b) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency react-hook-form to ^7.80.0

- [#1400](https://github.com/sanity-io/plugins/pull/1400) [`169782e`](https://github.com/sanity-io/plugins/commit/169782e2f6fc6b91ab6c7efaae197a65b6a55640) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency nanoid to ^5.1.15

## 5.0.2

### Patch Changes

- [#1383](https://github.com/sanity-io/plugins/pull/1383) [`e4231ba`](https://github.com/sanity-io/plugins/commit/e4231bad0ca3ac4e1be0027aeaf55140d07269b8) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency nanoid to v5

## 5.0.1

### Patch Changes

- [`6534752`](https://github.com/sanity-io/plugins/commit/653475267ee8bd378bd91fa543f259a04102852e) Thanks [@stipsan](https://github.com/stipsan)! - fix(deps): Update nanoid from v3 to v4

## 5.0.0

### Major Changes

- [#1354](https://github.com/sanity-io/plugins/pull/1354) [`3217cf8`](https://github.com/sanity-io/plugins/commit/3217cf801b2e84f41336d6ffa097dd77289a0383) Thanks [@stipsan](https://github.com/stipsan)! - Drop the CommonJS build and require Sanity Studio v5 or v6

  The plugin is now published as ESM only and no longer ships a CommonJS (`require`) build. The `sanity` peer dependency is also tightened to `^5 || ^6.0.0-0`, dropping declared support for Studio v3 and v4. Sanity Studio v5+ is pure ESM and the supported Node.js versions handle `require(esm)`, so a separate CommonJS build is no longer needed and only risks two copies of the code ending up in the module tree.

### Patch Changes

- [#1353](https://github.com/sanity-io/plugins/pull/1353) [`5ff7063`](https://github.com/sanity-io/plugins/commit/5ff70639f75bce2a4d7ef88aa2ec03d82cae4acc) Thanks [@stipsan](https://github.com/stipsan)! - Remove the obsolete `@sanity/incompatible-plugin` Sanity Studio v2 compatibility shim (`sanity.json` and `v2-incompatible.js`)

- [#1352](https://github.com/sanity-io/plugins/pull/1352) [`2bae6e5`](https://github.com/sanity-io/plugins/commit/2bae6e5c958d7b90449a13a9ef57ea45f831a454) Thanks [@stipsan](https://github.com/stipsan)! - Remove `src` from the published `files` array; only the compiled `dist` output is published.

## 4.3.6

### Patch Changes

- [#1295](https://github.com/sanity-io/plugins/pull/1295) [`3024eab`](https://github.com/sanity-io/plugins/commit/3024eab48dcc4ce3f0838a585fda6f5129a906b7) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency @hookform/resolvers to ^3.10.0

- [#1300](https://github.com/sanity-io/plugins/pull/1300) [`1899536`](https://github.com/sanity-io/plugins/commit/18995360fcf9f989bbff44be439682f874a5f977) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency @reduxjs/toolkit to ^2.12.0

- [#1304](https://github.com/sanity-io/plugins/pull/1304) [`5d2195a`](https://github.com/sanity-io/plugins/commit/5d2195a8b56b1907391a6bfb9cff9ca5448bc9dc) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency @sanity/uuid to ^3.0.3

- [#1305](https://github.com/sanity-io/plugins/pull/1305) [`daf9a60`](https://github.com/sanity-io/plugins/commit/daf9a606b851a12da1b96b51589645374978360b) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency @tanem/react-nprogress to ^5.0.63

- [#1310](https://github.com/sanity-io/plugins/pull/1310) [`c97c545`](https://github.com/sanity-io/plugins/commit/c97c54546a68e4c89dd0e6de655e49e573821046) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency copy-to-clipboard to ^3.3.3

- [#1312](https://github.com/sanity-io/plugins/pull/1312) [`6c222d1`](https://github.com/sanity-io/plugins/commit/6c222d1508e3f560db21d51baaca397f5fc30cea) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency filesize to ^9.0.11

- [#1318](https://github.com/sanity-io/plugins/pull/1318) [`24fe4d7`](https://github.com/sanity-io/plugins/commit/24fe4d751650a456640faa7517f5883b92a9102e) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency nanoid to ^3.3.12

- [#1320](https://github.com/sanity-io/plugins/pull/1320) [`7da3682`](https://github.com/sanity-io/plugins/commit/7da368238e0a26c364c22cf8b7e5dc94fddd48b6) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency react-dropzone to ^11.7.1

- [#1321](https://github.com/sanity-io/plugins/pull/1321) [`ca52ded`](https://github.com/sanity-io/plugins/commit/ca52dedfb0c15d71f9643bcaa7320fa6df61920d) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency react-hook-form to ^7.79.0

- [#1325](https://github.com/sanity-io/plugins/pull/1325) [`a4cfd08`](https://github.com/sanity-io/plugins/commit/a4cfd085c8c226a3001a3357a0fc425af1cb8656) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency react-redux to ^9.3.0

- [#1326](https://github.com/sanity-io/plugins/pull/1326) [`c9393a2`](https://github.com/sanity-io/plugins/commit/c9393a295e8ae5da7aaea62b276f89e9f4c63b29) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency react-select to ^5.10.2

- [#1328](https://github.com/sanity-io/plugins/pull/1328) [`59dad41`](https://github.com/sanity-io/plugins/commit/59dad4101e6a8baf56495b4b2a6f54d816e06f94) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency react-virtuoso to ^4.18.7

- [#1333](https://github.com/sanity-io/plugins/pull/1333) [`fd0a23c`](https://github.com/sanity-io/plugins/commit/fd0a23cba266df724c5e542aa471d0b111f16bf4) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency zod to ^3.25.76

- [#1339](https://github.com/sanity-io/plugins/pull/1339) [`26ff1a7`](https://github.com/sanity-io/plugins/commit/26ff1a7a06b3837a08b7befee5486988cc45645e) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency @hookform/resolvers to v4.1.3

- [#1342](https://github.com/sanity-io/plugins/pull/1342) [`9a60eae`](https://github.com/sanity-io/plugins/commit/9a60eae5de3cce25317b38c5d6fc070651a33c0d) Thanks [@stipsan](https://github.com/stipsan)! - Clean up unused internal files and exports now that the package is covered by knip.

- [#1347](https://github.com/sanity-io/plugins/pull/1347) [`fabdc72`](https://github.com/sanity-io/plugins/commit/fabdc726bb1c9abee0e16252422ebd27a3d8e428) Thanks [@stipsan](https://github.com/stipsan)! - Adopt the shared monorepo TypeScript and lint conventions (shared `@repo/tsconfig`, type-aware linting, styled-components Babel transform) and fix the type errors surfaced by the stricter config.

## 4.3.5

### Patch Changes

- [#1205](https://github.com/sanity-io/plugins/pull/1205) [`a0c60af`](https://github.com/sanity-io/plugins/commit/a0c60af8b19d67cf8c4caaf6d166ff906fc6f73e) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency rxjs to ^7.8.2

- [#1206](https://github.com/sanity-io/plugins/pull/1206) [`989b4f4`](https://github.com/sanity-io/plugins/commit/989b4f49ea29954cc5a2bb072c79f1b44eec25d3) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update sanity monorepo

- [#1215](https://github.com/sanity-io/plugins/pull/1215) [`d18625a`](https://github.com/sanity-io/plugins/commit/d18625a2a396f71b803814a11f1a72fde69885e6) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update sanity monorepo to v6

## 4.3.4

### Patch Changes

- [#1184](https://github.com/sanity-io/plugins/pull/1184) [`0e56680`](https://github.com/sanity-io/plugins/commit/0e56680d767d3c4974d1d2fe860d962e9953269d) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency @sanity/icons to ^3.7.4

- [#1185](https://github.com/sanity-io/plugins/pull/1185) [`91055eb`](https://github.com/sanity-io/plugins/commit/91055ebe32d5e78dfbf717bcc0b55387be46bb9d) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency @sanity/ui to ^3.2.0

## 4.3.3

### Patch Changes

- [#1128](https://github.com/sanity-io/plugins/pull/1128) [`fd78991`](https://github.com/sanity-io/plugins/commit/fd7899182e4d591365ac77589113e2e41ad693c3) Thanks [@stipsan](https://github.com/stipsan)! - Migrate to ESM (`"type": "module"`) and upgrade `@sanity/pkg-utils` to v10, as required by `@sanity/plugin-kit`. The package still ships both ESM and CommonJS builds via the `exports` map, so consumers are unaffected.

## 4.3.2

### Patch Changes

- [#978](https://github.com/sanity-io/plugins/pull/978) [`72976d5`](https://github.com/sanity-io/plugins/commit/72976d5012a09821198ddfb910de375e69f14855) Thanks [@robinpyon](https://github.com/robinpyon), [@stipsan](https://github.com/stipsan), [@snorrees](https://github.com/snorrees), [@rexxars](https://github.com/rexxars), [@bjoerge](https://github.com/bjoerge), [@Grsmto](https://github.com/Grsmto), [@Shastel](https://github.com/Shastel), [@RitaDias](https://github.com/RitaDias), [@SimeonGriggs](https://github.com/SimeonGriggs), [@thebiggianthead](https://github.com/thebiggianthead), [@osnoser1](https://github.com/osnoser1), [@Hahlh](https://github.com/Hahlh), [@coreyward](https://github.com/coreyward), [@tractorcow](https://github.com/tractorcow), [@einarlove](https://github.com/einarlove), [@hdoro](https://github.com/hdoro), [@joshuaellis](https://github.com/joshuaellis), [@LucaArgentieri](https://github.com/LucaArgentieri), [@mxmzb](https://github.com/mxmzb), [@nickrttn](https://github.com/nickrttn), [@nkgentile](https://github.com/nkgentile), [@oleg1357](https://github.com/oleg1357), [@pedrobonamin](https://github.com/pedrobonamin), [@r3nanp](https://github.com/r3nanp), [@wiiiimm](https://github.com/wiiiimm)! - Move sanity-plugin-media to the [sanity-io/plugins](https://github.com/sanity-io/plugins) monorepo. No functional changes.

## [4.3.1](https://github.com/sanity-io/sanity-plugin-media/compare/v4.3.0...v4.3.1) (2026-06-09)

### Bug Fixes

- **deps:** add support for sanity v6 prerelease versions ([#297](https://github.com/sanity-io/sanity-plugin-media/issues/297)) ([dcd94e6](https://github.com/sanity-io/sanity-plugin-media/commit/dcd94e6450ddc54088af65f9bc9316b35b12f140))

## [4.3.0](https://github.com/sanity-io/sanity-plugin-media/compare/v4.2.0...v4.3.0) (2026-05-13)

### Features

- Auto-tag images on upload ([#274](https://github.com/sanity-io/sanity-plugin-media/issues/274)) ([d454ae0](https://github.com/sanity-io/sanity-plugin-media/commit/d454ae0e56404041b9b60ea97fc94bd10e037260))

## [4.2.0](https://github.com/sanity-io/sanity-plugin-media/compare/v4.1.1...v4.2.0) (2026-04-23)

### Features

- localized asset fields options ([#271](https://github.com/sanity-io/sanity-plugin-media/issues/271)) ([17c46fe](https://github.com/sanity-io/sanity-plugin-media/commit/17c46fef889e1d655de452062a4fa66b6443fa02))

## [4.1.1](https://github.com/sanity-io/sanity-plugin-media/compare/v4.1.0...v4.1.1) (2025-12-17)

### Bug Fixes

- allow sanity v5 as peer dependency ([#270](https://github.com/sanity-io/sanity-plugin-media/issues/270)) ([be3d114](https://github.com/sanity-io/sanity-plugin-media/commit/be3d11422e019a082f2428db99b4b4a81d5131fb))

## [4.1.0](https://github.com/sanity-io/sanity-plugin-media/compare/v4.0.0...v4.1.0) (2025-12-04)

### Features

- allow 'directUploads' option on the tool ([#266](https://github.com/sanity-io/sanity-plugin-media/issues/266)) ([aabaf2c](https://github.com/sanity-io/sanity-plugin-media/commit/aabaf2cb706fc3631f3a6b49403fc443a7c9bceb))
- create ability to define a custom compoenent to present details ([#267](https://github.com/sanity-io/sanity-plugin-media/issues/267)) ([d334712](https://github.com/sanity-io/sanity-plugin-media/commit/d334712b2bab248d2e142152cf5060be0fee1db6))

### Bug Fixes

- update date-fns imports to v4 syntax ([#263](https://github.com/sanity-io/sanity-plugin-media/issues/263)) ([fb82858](https://github.com/sanity-io/sanity-plugin-media/commit/fb8285837b0423a6ce67801b935aee519f1c7003)), closes [#262](https://github.com/sanity-io/sanity-plugin-media/issues/262)

## [4.0.0](https://github.com/sanity-io/sanity-plugin-media/compare/v3.0.5...v4.0.0) (2025-07-31)

### ⚠ BREAKING CHANGES

- **deps:** update dependency @sanity/ui to v3 (#261)

### Bug Fixes

- **deps:** update dependency @sanity/ui to v3 ([#261](https://github.com/sanity-io/sanity-plugin-media/issues/261)) ([3321238](https://github.com/sanity-io/sanity-plugin-media/commit/3321238555f3dff8cdd4f9e9764ef74c31819c77))

## [3.0.5](https://github.com/sanity-io/sanity-plugin-media/compare/v3.0.4...v3.0.5) (2025-07-31)

### Bug Fixes

- remove `@sanity/ui` from peer deps ([d239ca7](https://github.com/sanity-io/sanity-plugin-media/commit/d239ca730d51481187cbb08751f15898bb0cabf8))

## [3.0.4](https://github.com/sanity-io/sanity-plugin-media/compare/v3.0.3...v3.0.4) (2025-07-10)

### Bug Fixes

- **deps:** allow studio v4 in peer dep ranges ([#259](https://github.com/sanity-io/sanity-plugin-media/issues/259)) ([5aea7a7](https://github.com/sanity-io/sanity-plugin-media/commit/5aea7a714331db4b1e3d30fea6edb392ff3ce198))

## [3.0.3](https://github.com/sanity-io/sanity-plugin-media/compare/v3.0.2...v3.0.3) (2025-06-04)

### Bug Fixes

- fixed grid view only show 1 item bug ([#255](https://github.com/sanity-io/sanity-plugin-media/issues/255)) ([9b5002b](https://github.com/sanity-io/sanity-plugin-media/commit/9b5002b03ecfcaba16e717a2ebc5f7b6300dc45c))

## [3.0.3](https://github.com/sanity-io/sanity-plugin-media/compare/v3.0.2...v3.0.3) (2025-04-30)

### Bug Fixes

- fix: forward refs in AssetGridVirtualized ListContainer/ItemContainer for react-virtuoso compatibility ([see details](https://github.com/sanity-io/sanity-plugin-media/commit/HEAD))

## [3.0.2](https://github.com/sanity-io/sanity-plugin-media/compare/v3.0.1...v3.0.2) (2025-03-19)

### Bug Fixes

- **deps:** Update dependency date-fns to v4 ([#247](https://github.com/sanity-io/sanity-plugin-media/issues/247)) ([4c16590](https://github.com/sanity-io/sanity-plugin-media/commit/4c1659067e1109583507172ea719146083f5f416))
- update date-fns to v3 ([#220](https://github.com/sanity-io/sanity-plugin-media/issues/220)) ([a8f02e0](https://github.com/sanity-io/sanity-plugin-media/commit/a8f02e03236cdd76edcb8057d09318e3fdfec724))

## [3.0.1](https://github.com/sanity-io/sanity-plugin-media/compare/v3.0.0...v3.0.1) (2025-03-07)

### Bug Fixes

- animate tooltips ([3e7487c](https://github.com/sanity-io/sanity-plugin-media/commit/3e7487c4d38d3ebb59c772c46d4d2b3fa60fb3d2))
- handle styled-components attribute warnings ([25e4ed3](https://github.com/sanity-io/sanity-plugin-media/commit/25e4ed3402cd7e34d417431b92f1e8ec60474003))

## [3.0.0](https://github.com/sanity-io/sanity-plugin-media/compare/v2.4.2...v3.0.0) (2025-03-07)

### ⚠ BREAKING CHANGES

- add react 19 support (#243)

### Features

- add react 19 support ([#243](https://github.com/sanity-io/sanity-plugin-media/issues/243)) ([1e26560](https://github.com/sanity-io/sanity-plugin-media/commit/1e265609c3c59a891b55c202aa97c7a40be030f2))

## [2.4.2](https://github.com/sanity-io/sanity-plugin-media/compare/v2.4.1...v2.4.2) (2025-03-07)

### Bug Fixes

- **deps:** update redux ([#237](https://github.com/sanity-io/sanity-plugin-media/issues/237)) ([97a1ccc](https://github.com/sanity-io/sanity-plugin-media/commit/97a1cccdac23290748bcbba245ed519927a72260))
- remove `useColorScheme()` deprecation warning ([3f15058](https://github.com/sanity-io/sanity-plugin-media/commit/3f150586c161c10142e0d0c132d9839b50986f9c))

## [2.4.1](https://github.com/sanity-io/sanity-plugin-media/compare/v2.4.0...v2.4.1) (2025-03-07)

### Bug Fixes

- export typings correctly ([b850424](https://github.com/sanity-io/sanity-plugin-media/commit/b85042463e56bcec0d44c625e8eeeb85414231fc))

## [2.4.0](https://github.com/sanity-io/sanity-plugin-media/compare/v2.3.2...v2.4.0) (2025-03-07)

### Features

- add \_\_internalApplicationType to tool spec ([#235](https://github.com/sanity-io/sanity-plugin-media/issues/235)) ([602145b](https://github.com/sanity-io/sanity-plugin-media/commit/602145b65746fecdd43aee8191bb544fbe209d32))

### Bug Fixes

- stop inlining `@sanity/icons`, `@sanity/color` ([592cd93](https://github.com/sanity-io/sanity-plugin-media/commit/592cd9374a1df04f38ea60c7fd20fba97e2da7ea))

## [2.3.2](https://github.com/sanity-io/sanity-plugin-media/compare/v2.3.1...v2.3.2) (2024-07-22)

### Bug Fixes

- **docs:** readme for creditLine and maximumUploadSize ([1b4ac30](https://github.com/sanity-io/sanity-plugin-media/commit/1b4ac30df4e5ae4acbe78352b60ab1a78fbf6a9a))

## [2.3.1](https://github.com/sanity-io/sanity-plugin-media/compare/v2.3.0...v2.3.1) (2024-07-19)

### Bug Fixes

- add a layout component to provide tool options ([1512fba](https://github.com/sanity-io/sanity-plugin-media/commit/1512fbac94c8e3f77ed5394a1b14ac3c97b75aff))

## [2.3.0](https://github.com/sanity-io/sanity-plugin-media/compare/v2.2.5...v2.3.0) (2024-07-16)

### Features

- [#203](https://github.com/sanity-io/sanity-plugin-media/issues/203) allow users to specify maximum upload size ([ae2bcd8](https://github.com/sanity-io/sanity-plugin-media/commit/ae2bcd8e706bb465500a552ad18fcb29cebb0719))

## [2.2.5](https://github.com/sanity-io/sanity-plugin-media/compare/v2.2.4...v2.2.5) (2024-01-12)

### Bug Fixes

- **deps:** bump @sanity/ui, widen peer dependency range ([a6c8982](https://github.com/sanity-io/sanity-plugin-media/commit/a6c898244a2f8311cf0c1b08cd13988f98226036))
- **deps:** widen styled-components peer dependency range ([8a81bb1](https://github.com/sanity-io/sanity-plugin-media/commit/8a81bb1153b726fc454d8718670ad985bf266dba))

## [2.2.4](https://github.com/sanity-io/sanity-plugin-media/compare/v2.2.3...v2.2.4) (2023-10-27)

### Bug Fixes

- add dist to exported files ([#193](https://github.com/sanity-io/sanity-plugin-media/issues/193)) ([1db113b](https://github.com/sanity-io/sanity-plugin-media/commit/1db113bf07ad0ca3254293fae8beb16bb95e70a0))

## [2.2.3](https://github.com/sanity-io/sanity-plugin-media/compare/v2.2.2...v2.2.3) (2023-10-27)

### Bug Fixes

- update pkg-utils and export config ([#192](https://github.com/sanity-io/sanity-plugin-media/issues/192)) ([cdc8b2c](https://github.com/sanity-io/sanity-plugin-media/commit/cdc8b2cd8995b6c2e115912ecf7aca7da5ee9fc5))

## [2.2.2](https://github.com/sanity-io/sanity-plugin-media/compare/v2.2.1...v2.2.2) (2023-07-26)

### Bug Fixes

- display color scheme-specific styles ([f6e58fe](https://github.com/sanity-io/sanity-plugin-media/commit/f6e58fe609920c690d1e6211eeca1383195e7609))
- increase default pageSize to 100 ([b7b08f3](https://github.com/sanity-io/sanity-plugin-media/commit/b7b08f38fbc7ce677f0e6e85c2ab4d306077150d))
- prevent TypeError when deleting assets in table view ([a86764c](https://github.com/sanity-io/sanity-plugin-media/commit/a86764cd61d789713bf11cc6199ef6bc04e34ba8))

## [2.2.1](https://github.com/sanity-io/sanity-plugin-media/compare/v2.2.0...v2.2.1) (2023-07-07)

### Bug Fixes

- **deps:** update dependency filesize to v9 ([#160](https://github.com/sanity-io/sanity-plugin-media/issues/160)) ([476a413](https://github.com/sanity-io/sanity-plugin-media/commit/476a41388a0ed480074ef4d368cd3d6acf5178a3))
- **deps:** update dependency groq to v3 ([#161](https://github.com/sanity-io/sanity-plugin-media/issues/161)) ([92e94c0](https://github.com/sanity-io/sanity-plugin-media/commit/92e94c001fa38dc33a1608c64759c5dcfc123b30))
- ensure asset description textarea is connected to react-hook-form ([a5b69be](https://github.com/sanity-io/sanity-plugin-media/commit/a5b69bee94356b6600c5954a7051e594a1d39411))

## [2.2.0](https://github.com/sanity-io/sanity-plugin-media/compare/v2.1.1...v2.2.0) (2023-07-05)

### Features

- add reference count to asset list ([#148](https://github.com/sanity-io/sanity-plugin-media/issues/148)) ([c12d1e5](https://github.com/sanity-io/sanity-plugin-media/commit/c12d1e56758efab3d5722c70817753bccb1d5df0))

## [2.1.1](https://github.com/sanity-io/sanity-plugin-media/compare/v2.1.0...v2.1.1) (2023-07-05)

### Bug Fixes

- update react-hook-form, use zod for schema validation, drop legacy-peer-deps npmrc ([cc982bb](https://github.com/sanity-io/sanity-plugin-media/commit/cc982bbd193b3436d60dd0d48a7411d9c865bf11))

## [2.1.0](https://github.com/sanity-io/sanity-plugin-media/compare/v2.0.6...v2.1.0) (2023-07-03)

### Features

- add support for multiple tags ([5f5bea8](https://github.com/sanity-io/sanity-plugin-media/commit/5f5bea828abe2867c9273e57bbeca351825cec9f))

## [2.0.6](https://github.com/sanity-io/sanity-plugin-media/compare/v2.0.5...v2.0.6) (2023-07-03)

### Bug Fixes

- **deps:** update dependencies (non-major) ([#149](https://github.com/sanity-io/sanity-plugin-media/issues/149)) ([d7943e8](https://github.com/sanity-io/sanity-plugin-media/commit/d7943e821b1b987b5eda5165387af59461345558))
- ensure popovers display correctly when the plugin is invoked via an image input ([0d92ab9](https://github.com/sanity-io/sanity-plugin-media/commit/0d92ab90f1e7231d8867234c2489aaa7533fdb07))
- force overflow-y scroll to prevent grid offset on mount ([804e125](https://github.com/sanity-io/sanity-plugin-media/commit/804e12598d00688a99d4f8aa5e934a643008eaeb))
- prevent tag panel title from collapsing on small viewports ([a415924](https://github.com/sanity-io/sanity-plugin-media/commit/a41592412754078dce14db23e0d33d9035c4b346))
- suppress redux-toolkit $CombinedState errors ([b7c6fd1](https://github.com/sanity-io/sanity-plugin-media/commit/b7c6fd13536c60b848f01875650d7fe722a7b0ee))
- use tooltip portals, remove cancel upload button tooltips until portal issues are fixed in ui ([ea549e1](https://github.com/sanity-io/sanity-plugin-media/commit/ea549e1b563566c1361e30fddc8e7c48275dcc15))

## [2.0.5](https://github.com/sanity-io/sanity-plugin-media/compare/v2.0.4...v2.0.5) (2023-02-03)

### Bug Fixes

- prevent removal of last character on no filename extension ([#120](https://github.com/sanity-io/sanity-plugin-media/issues/120)) ([3c0db14](https://github.com/sanity-io/sanity-plugin-media/commit/3c0db1428d1995cd22daaf56d16dfdaaf989ab69))

## [2.0.4](https://github.com/sanity-io/sanity-plugin-media/compare/v2.0.3...v2.0.4) (2023-01-21)

### Bug Fixes

- **deps:** upgrade sanity, rxjs and redux observable ([#113](https://github.com/sanity-io/sanity-plugin-media/issues/113)) ([3c10149](https://github.com/sanity-io/sanity-plugin-media/commit/3c101498c4145b94d41ed9bd54814b5a401258c5))

## [2.0.3](https://github.com/sanity-io/sanity-plugin-media/compare/v2.0.2...v2.0.3) (2023-01-18)

### Bug Fixes

- **docs:** install version ([a00d64f](https://github.com/sanity-io/sanity-plugin-media/commit/a00d64fb08828e8222fce061cb47d6adf789d522))

## [2.0.2](https://github.com/sanity-io/sanity-plugin-media/compare/v2.0.1...v2.0.2) (2022-11-25)

### Bug Fixes

- **deps:** bump ([ed758ee](https://github.com/sanity-io/sanity-plugin-media/commit/ed758eef2a58fde92d8b451630388c52ccb37316))

## [2.0.1](https://github.com/sanity-io/sanity-plugin-media/compare/v2.0.0...v2.0.1) (2022-11-25)

### Bug Fixes

- **deps:** 3.0.0-rc.3 ([c823c5a](https://github.com/sanity-io/sanity-plugin-media/commit/c823c5a27eec30679e0aab7f9d2b2b6a5d9cd105))
- renamed import ([8f81da7](https://github.com/sanity-io/sanity-plugin-media/commit/8f81da7590020ab91e41daafdb133bdd870d5fd2))

## [2.0.0](https://github.com/sanity-io/sanity-plugin-media/compare/v1.4.13...v2.0.0) (2022-11-17)

### ⚠ BREAKING CHANGES

- this version does not work in Sanity Studio v2
- initial studio v3 version

### Features

- initial Sanity Studio v3 release ([8f6dd55](https://github.com/sanity-io/sanity-plugin-media/commit/8f6dd5561a9c811b21263b574104f9c89cc8fb36))
- initial studio v3 version ([beb5531](https://github.com/sanity-io/sanity-plugin-media/commit/beb55317235792c7337e9dbfc8c3ffe4f88ff5e5))

### Bug Fixes

- apply upstream v2-studio fixes, add semver automation workflow ([100f3eb](https://github.com/sanity-io/sanity-plugin-media/commit/100f3eb226e80d8eef81dae1dc1c688d1ceab797)), closes [#88](https://github.com/sanity-io/sanity-plugin-media/issues/88) [#50](https://github.com/sanity-io/sanity-plugin-media/issues/50) [#57](https://github.com/sanity-io/sanity-plugin-media/issues/57) [#82](https://github.com/sanity-io/sanity-plugin-media/issues/82)
- correctly infer filename from files containing uppercase extensions, tweak upload card layout ([1e96b79](https://github.com/sanity-io/sanity-plugin-media/commit/1e96b79d2bbec456fac9c39b072a487eef9932ad))
- **deps:** compiled for sanity 3.0.0-rc.0 ([20466ab](https://github.com/sanity-io/sanity-plugin-media/commit/20466abce56aae41d0406f4fa7d817a927c741e8))
- **deps:** dev-preview.21 ([4f9588a](https://github.com/sanity-io/sanity-plugin-media/commit/4f9588addd4828c5d9beb7457a2437bcb25c464c))
- initial v3 work ([4517bb5](https://github.com/sanity-io/sanity-plugin-media/commit/4517bb532b60c42eb9058887d206969b23191373))
- re-enable references tab panel ([ac698b3](https://github.com/sanity-io/sanity-plugin-media/commit/ac698b3a74be31774914c7f68981485826a67807))

## [2.0.0-v3-studio.3](https://github.com/sanity-io/sanity-plugin-media/compare/v2.0.0-v3-studio.2...v2.0.0-v3-studio.3) (2022-11-07)

### Bug Fixes

- **deps:** compiled for sanity 3.0.0-rc.0 ([20466ab](https://github.com/sanity-io/sanity-plugin-media/commit/20466abce56aae41d0406f4fa7d817a927c741e8))

## [2.0.0-v3-studio.2](https://github.com/robinpyon/sanity-plugin-media/compare/v2.0.0-v3-studio.1...v2.0.0-v3-studio.2) (2022-10-07)

### Bug Fixes

- **deps:** dev-preview.21 ([4f9588a](https://github.com/robinpyon/sanity-plugin-media/commit/4f9588addd4828c5d9beb7457a2437bcb25c464c))

## [2.0.0-v3-studio.1](https://github.com/robinpyon/sanity-plugin-media/compare/v1.4.8...v2.0.0-v3-studio.1) (2022-10-06)

### Bug Fixes

- apply upstream v2-studio fixes, add semver automation workflow ([100f3eb](https://github.com/robinpyon/sanity-plugin-media/commit/100f3eb226e80d8eef81dae1dc1c688d1ceab797)), closes [#88](https://github.com/robinpyon/sanity-plugin-media/issues/88) [#50](https://github.com/robinpyon/sanity-plugin-media/issues/50) [#57](https://github.com/robinpyon/sanity-plugin-media/issues/57) [#82](https://github.com/robinpyon/sanity-plugin-media/issues/82)
- initial v3 work ([4517bb5](https://github.com/robinpyon/sanity-plugin-media/commit/4517bb532b60c42eb9058887d206969b23191373))
- re-enable references tab panel ([ac698b3](https://github.com/robinpyon/sanity-plugin-media/commit/ac698b3a74be31774914c7f68981485826a67807))
- remove rxjs and @sanity/client from peerDependencies ([b4df1f5](https://github.com/robinpyon/sanity-plugin-media/commit/b4df1f5ba067ff0e28dda08d376b03d444967d68))

### Reverts

- Revert "fix: flatten blob gen + upload actions to ensure null blobs correctly throw errors and bubble up" ([7a387c4](https://github.com/robinpyon/sanity-plugin-media/commit/7a387c43c7a6701a9c3e7876d189722e03161e17))
