# @sanity/google-maps-input

## 6.0.2

### Patch Changes

- [#1417](https://github.com/sanity-io/plugins/pull/1417) [`50df1f2`](https://github.com/sanity-io/plugins/commit/50df1f287debd7069531f4dcf8f23f740c487923) Thanks [@stipsan](https://github.com/stipsan)! - Migrate internal styling from styled-components to vanilla-extract (zero-runtime CSS)

## 6.0.1

### Patch Changes

- [#1412](https://github.com/sanity-io/plugins/pull/1412) [`40aed1e`](https://github.com/sanity-io/plugins/commit/40aed1e4e9ce5ddb90fdd05d2463368d63a2e449) Thanks [@stipsan](https://github.com/stipsan)! - Fix `InvalidValueError` ("not an instance of LatLng … in property lat: not a number") thrown when opening the map editor for an empty geopoint, such as a newly added array item. Map markers, the radius circle and the map center are now only rendered once the value has finite `lat`/`lng` coordinates, and empty items show a "Set location" button instead of a broken preview.

- [#1220](https://github.com/sanity-io/plugins/pull/1220) [`b81e9cf`](https://github.com/sanity-io/plugins/commit/b81e9cfa61d3d752fbf266fd8cb362256ea4ce18) Thanks [@stipsan](https://github.com/stipsan)! - Avoid a runtime error in the `geopointRadius` list preview when a document has an incomplete location: `prepare` now guards against missing `lat`/`lng` and shows "No location set" instead of throwing on `lat.toFixed()`.

## 6.0.0

### Major Changes

- [#1219](https://github.com/sanity-io/plugins/pull/1219) [`9ffc169`](https://github.com/sanity-io/plugins/commit/9ffc1697824396925389783a2344e3f42e41970c) Thanks [@stipsan](https://github.com/stipsan)! - Modernize the map input by rebuilding it on [`@vis.gl/react-google-maps`](https://visgl.github.io/react-google-maps/), improve the key-configuration UX, and implement Review Changes diffs.

  - The map now loads via `<APIProvider>` (with `loading=async`) and uses the library's components: a default advanced marker, `StaticMap`/`createStaticMapsUrl` for the location preview, and an editable `<Circle>` for the radius.
  - Place search now uses the new `gmp-place-autocomplete` web component backed by the **Places API (New)**, replacing the legacy `google.maps.places.Autocomplete` widget — giving better autocomplete results and a nicer search UX.
  - This refactors away from deprecated Google Maps APIs, resolving the runtime console deprecation warnings for:
    - `google.maps.Marker` → `google.maps.marker.AdvancedMarkerElement`
    - `google.maps.places.Autocomplete` → `google.maps.places.PlaceAutocompleteElement`
    - loading the Maps JavaScript API without `loading=async`
  - Implemented the Review Changes diff: `geopoint` and `geopointRadius` changes now render a before/after static map preview (matching the built-in image diff) instead of raw latitude/longitude/radius field diffs. `geopointRadius` wires this automatically; for the built-in `geopoint` type, attach the exported `GeopointDiff` to your field's `components.diff`.
  - The radius preview now auto-fits the viewport so the whole circle stays within the image instead of being clipped.
  - A missing key renders a clear warning card (how to add `apiKey` to the plugin config and which Google APIs it needs); a rejected key replaces the map/preview with an actionable error card noting the key may be invalid, a demo key, or restricted, and listing the required APIs (Google Maps JavaScript API, Google Static Maps API, Google Places API (New)).
  - **Breaking:** removes the previously exported (but non-functional) `GeopointFieldDiff`, `GeopointArrayDiff`, and `GeopointRadiusFieldDiff` components (and their prop types), replaced by the single `GeopointDiff`.

## 5.0.2

### Patch Changes

- [`a1aca4c`](https://github.com/sanity-io/plugins/commit/a1aca4cf86dacafdfce449465181253af6a550d3) Thanks [@stipsan](https://github.com/stipsan)! - Stop publishing the `assets` directory to npm and reference README images via absolute GitHub URLs

## 5.0.1

### Patch Changes

- [#1301](https://github.com/sanity-io/plugins/pull/1301) [`0ae4670`](https://github.com/sanity-io/plugins/commit/0ae46700585f4b91e133f02f0ce688b604482e5f) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency @sanity/icons to ^3.7.4

## 5.0.0

### Major Changes

- [#1026](https://github.com/sanity-io/plugins/pull/1026) [`62b695b`](https://github.com/sanity-io/plugins/commit/62b695b340fa33feaea8f71fbb7545bfcd48804c) Thanks [@snorrees](https://github.com/snorrees), [@bjoerge](https://github.com/bjoerge), [@rexxars](https://github.com/rexxars), [@stipsan](https://github.com/stipsan), [@SimeonGriggs](https://github.com/SimeonGriggs), [@pedrobonamin](https://github.com/pedrobonamin), [@pierrenel](https://github.com/pierrenel), [@RitaDias](https://github.com/RitaDias), [@liamb13](https://github.com/liamb13)! - Port @sanity/google-maps-input to the Sanity plugins monorepo

  This major release includes several breaking changes as part of the migration to the monorepo:

  - **React Compiler enabled**: The package is now built with React Compiler targeting React 19
  - **ESM-only**: CommonJS support has been removed. The package now ships only ESM
  - **React 19.2+ required**: Minimum React version is now 19.2 (previously ^18 || ^19)
  - **react-dom 19.2+ required**: `react-dom` is now a required peer dependency
  - **Sanity Studio v5+ required**: Minimum Sanity version is now v5 (Sanity v3 and v4 are no longer supported)
  - **Node.js 20.19+ required**: Minimum Node.js version is now 20.19 (previously >=18)

## [4.2.1](https://github.com/sanity-io/google-maps-input/compare/v4.2.0...v4.2.1) (2025-12-18)

### Bug Fixes

- **deps:** make peer dependencies include sanity 5.x ([#84](https://github.com/sanity-io/google-maps-input/issues/84)) ([d93df4b](https://github.com/sanity-io/google-maps-input/commit/d93df4bccfd0824685f9366f93e0070533f375e5))

## [4.2.0](https://github.com/sanity-io/google-maps-input/compare/v4.1.1...v4.2.0) (2025-07-31)

### Features

- adds a circle radius input ([#81](https://github.com/sanity-io/google-maps-input/issues/81)) ([f5a2209](https://github.com/sanity-io/google-maps-input/commit/f5a2209b5596612088f528d64051f37bc78b950b))

### Bug Fixes

- **deps:** Update dependency @sanity/ui to v3 ([#82](https://github.com/sanity-io/google-maps-input/issues/82)) ([38f060e](https://github.com/sanity-io/google-maps-input/commit/38f060e2c67673cade8dc01ae0b7249f4b051096))

## [4.1.1](https://github.com/sanity-io/google-maps-input/compare/v4.1.0...v4.1.1) (2025-07-10)

### Bug Fixes

- **deps:** allow studio v4 in peer dep ranges + update main.yml ([#80](https://github.com/sanity-io/google-maps-input/issues/80)) ([200f8c7](https://github.com/sanity-io/google-maps-input/commit/200f8c7d3a6d1c2c245f71b680f49a3ac6c6eab0))

## [4.1.0](https://github.com/sanity-io/google-maps-input/compare/v4.0.1...v4.1.0) (2024-12-16)

### Features

- improve focus handling, open on double-click, support react 19 ([#75](https://github.com/sanity-io/google-maps-input/issues/75)) ([21541fc](https://github.com/sanity-io/google-maps-input/commit/21541fc2d273f0d983667c7be718a49f64f65a90))

## [4.0.1](https://github.com/sanity-io/google-maps-input/compare/v4.0.0...v4.0.1) (2024-04-09)

### Bug Fixes

- **deps:** use caret for styled-components peer dependency ([#70](https://github.com/sanity-io/google-maps-input/issues/70)) ([4b38112](https://github.com/sanity-io/google-maps-input/commit/4b381121d4d9a325480c1c77fabfab5fdb3e0990))

## [4.0.0](https://github.com/sanity-io/google-maps-input/compare/v3.0.2...v4.0.0) (2024-04-08)

### ⚠ BREAKING CHANGES

- **deps:** Requires sanity@>=3.19.0 installed as a peer dependency

### Bug Fixes

- **deps:** require sanity >=3.19.0 ([#69](https://github.com/sanity-io/google-maps-input/issues/69)) ([ef97355](https://github.com/sanity-io/google-maps-input/commit/ef973556c470e32a272d0aeace8c4e00954bfc00))
- **deps:** upgrade @sanity/ui and require styled-components v6 as peer dependency ([#68](https://github.com/sanity-io/google-maps-input/issues/68)) ([5cea2c9](https://github.com/sanity-io/google-maps-input/commit/5cea2c9854fa024c2f3c421bdc058216fffe7940))

## [3.0.2](https://github.com/sanity-io/google-maps-input/compare/v3.0.1...v3.0.2) (2023-10-27)

### Bug Fixes

- readme ([#56](https://github.com/sanity-io/google-maps-input/issues/56)) ([f498f06](https://github.com/sanity-io/google-maps-input/commit/f498f06195327d974dc7d9b4ddbfafed4a22fd6b))
- Update pkg-utils, plugin-kit, small UI tweaks ([#55](https://github.com/sanity-io/google-maps-input/issues/55)) ([67df7a7](https://github.com/sanity-io/google-maps-input/commit/67df7a75f72996de6fd9654b9a461aeadde4e625))

## [3.0.1](https://github.com/sanity-io/google-maps-input/compare/v3.0.0...v3.0.1) (2023-01-06)

### Bug Fixes

- **deps:** remove rxjs as dependency ([#24](https://github.com/sanity-io/google-maps-input/issues/24)) ([1aa8d20](https://github.com/sanity-io/google-maps-input/commit/1aa8d20fe88c8f9d14bb2ea77d056249ba1fa34b))

## [3.0.0](https://github.com/sanity-io/google-maps-input/compare/v2.35.2...v3.0.0) (2022-11-25)

### ⚠ BREAKING CHANGES

- this version does not work ins Sanity Studio v2

### Features

- initial Sanity Studio v3 release ([2b825ef](https://github.com/sanity-io/google-maps-input/commit/2b825efbad8b4924bd4e9e87d4f5398e3bbda83b))

### Bug Fixes

- compiled for sanity 3.0.0-rc.0 ([455b81c](https://github.com/sanity-io/google-maps-input/commit/455b81cd225634290c8af95f9726cc732db42d58))
- **deps:** dev-preview.21 ([82ece5d](https://github.com/sanity-io/google-maps-input/commit/82ece5d2171a24ee086364e94f30366c14bbd74d))
- **deps:** dev-preview.22 ([c637a35](https://github.com/sanity-io/google-maps-input/commit/c637a35b2e5d545e135ccf9e6b91b4092e20ad75))
- **deps:** pkg-utils & @sanity/plugin-kit ([e1a7053](https://github.com/sanity-io/google-maps-input/commit/e1a70534bd443b15aaf1c182b281085f49892d7c))
- **deps:** sanity ^3.0.0 (works with rc.3) ([e03c9c9](https://github.com/sanity-io/google-maps-input/commit/e03c9c9f487b1a88b91cd450441a8c487bcacccd))
- **deps:** sanity 3.0.0-dev-preview.17 and ui 0.38 ([e70074d](https://github.com/sanity-io/google-maps-input/commit/e70074d0e615e04c82e5012613cd00b1186a2216))
- **deps:** update dependencies (non-major) ([#3](https://github.com/sanity-io/google-maps-input/issues/3)) ([bc361e2](https://github.com/sanity-io/google-maps-input/commit/bc361e25aa75cc7bb0e1c2e22a944586b26b0396))
- **deps:** updated @sanity/ui ([a84ed1c](https://github.com/sanity-io/google-maps-input/commit/a84ed1ccd7f7ec6673eaf79ad5926bb483f58092))
- improve peer deps ([5c9c2fc](https://github.com/sanity-io/google-maps-input/commit/5c9c2fcf43e554fb24e3de2549468aa6b4e6360d))

## [3.0.0-v3-studio.8](https://github.com/sanity-io/google-maps-input/compare/v3.0.0-v3-studio.7...v3.0.0-v3-studio.8) (2022-11-04)

### Bug Fixes

- **deps:** pkg-utils & @sanity/plugin-kit ([e1a7053](https://github.com/sanity-io/google-maps-input/commit/e1a70534bd443b15aaf1c182b281085f49892d7c))

## [3.0.0-v3-studio.7](https://github.com/sanity-io/google-maps-input/compare/v3.0.0-v3-studio.6...v3.0.0-v3-studio.7) (2022-11-02)

### Bug Fixes

- compiled for sanity 3.0.0-rc.0 ([455b81c](https://github.com/sanity-io/google-maps-input/commit/455b81cd225634290c8af95f9726cc732db42d58))

## [3.0.0-v3-studio.6](https://github.com/sanity-io/google-maps-input/compare/v3.0.0-v3-studio.5...v3.0.0-v3-studio.6) (2022-10-27)

### Bug Fixes

- **deps:** dev-preview.22 ([c637a35](https://github.com/sanity-io/google-maps-input/commit/c637a35b2e5d545e135ccf9e6b91b4092e20ad75))

## [3.0.0-v3-studio.5](https://github.com/sanity-io/google-maps-input/compare/v3.0.0-v3-studio.4...v3.0.0-v3-studio.5) (2022-10-07)

### Bug Fixes

- **deps:** dev-preview.21 ([82ece5d](https://github.com/sanity-io/google-maps-input/commit/82ece5d2171a24ee086364e94f30366c14bbd74d))

## [3.0.0-v3-studio.4](https://github.com/sanity-io/google-maps-input/compare/v3.0.0-v3-studio.3...v3.0.0-v3-studio.4) (2022-09-28)

### Bug Fixes

- **deps:** update dependencies (non-major) ([#3](https://github.com/sanity-io/google-maps-input/issues/3)) ([bc361e2](https://github.com/sanity-io/google-maps-input/commit/bc361e25aa75cc7bb0e1c2e22a944586b26b0396))
- improve peer deps ([5c9c2fc](https://github.com/sanity-io/google-maps-input/commit/5c9c2fcf43e554fb24e3de2549468aa6b4e6360d))

## [3.0.0-v3-studio.3](https://github.com/sanity-io/google-maps-input/compare/v3.0.0-v3-studio.2...v3.0.0-v3-studio.3) (2022-09-15)

### Bug Fixes

- **deps:** sanity 3.0.0-dev-preview.17 and ui 0.38 ([e70074d](https://github.com/sanity-io/google-maps-input/commit/e70074d0e615e04c82e5012613cd00b1186a2216))

## [3.0.0-v3-studio.2](https://github.com/sanity-io/google-maps-input/compare/v3.0.0-v3-studio.1...v3.0.0-v3-studio.2) (2022-09-09)

### Bug Fixes

- **deps:** updated @sanity/ui ([a84ed1c](https://github.com/sanity-io/google-maps-input/commit/a84ed1ccd7f7ec6673eaf79ad5926bb483f58092))
