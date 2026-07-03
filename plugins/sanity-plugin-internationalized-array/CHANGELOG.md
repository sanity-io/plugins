# sanity-plugin-internationalized-array

## 5.1.14

### Patch Changes

- [#1460](https://github.com/sanity-io/plugins/pull/1460) [`f50f060`](https://github.com/sanity-io/plugins/commit/f50f0605968e5cec4f23f5f3455abe5c8ddda23c) Thanks [@stipsan](https://github.com/stipsan)! - Regenerate TypeScript declaration output: `isolatedDeclarations` is no longer used and declarations are now generated with tsgo (`@typescript/native-preview`). Internal build-tooling change only, with no runtime behavior or public API changes.

## 5.1.13

## 5.1.12

## 5.1.11

### Patch Changes

- [#1471](https://github.com/sanity-io/plugins/pull/1471) [`52487d2`](https://github.com/sanity-io/plugins/commit/52487d208f11fe2a4ccb523fab9386f3fbdd5880) Thanks [@stipsan](https://github.com/stipsan)! - Update `@sanity/icons` to v4 and adopt its per-icon import paths for smaller bundles and faster treeshaking

## 5.1.10

## 5.1.9

### Patch Changes

- [#1083](https://github.com/sanity-io/plugins/pull/1083) [`7e65764`](https://github.com/sanity-io/plugins/commit/7e65764c026879d6156e49d8380e3bd6d85f0697) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): Update lodash monorepo to ^4.18.1

## 5.1.8

### Patch Changes

- [`68fb45a`](https://github.com/sanity-io/plugins/commit/68fb45ae05271006813424506fb995cc84f79885) Thanks [@stipsan](https://github.com/stipsan)! - Use concistent peer dep definition

## 5.1.7

### Patch Changes

- [#984](https://github.com/sanity-io/plugins/pull/984) [`d723da8`](https://github.com/sanity-io/plugins/commit/d723da8cfe195b5fda540b17c708c2eeca1a07ee) Thanks [@stipsan](https://github.com/stipsan)! - Bump `@sanity/assist` peer range

## 5.1.6

### Patch Changes

- [#980](https://github.com/sanity-io/plugins/pull/980) [`98d148e`](https://github.com/sanity-io/plugins/commit/98d148e00ef679b422e1effe7fc53dfce9cb046c) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Update `@sanity/pkg-utils` to pick up a DTS generation bug fix.

## 5.1.5

### Patch Changes

- [#965](https://github.com/sanity-io/plugins/pull/965) [`064dc6b`](https://github.com/sanity-io/plugins/commit/064dc6b75c755dfd35f5be2441ed29cf295acfb8) Thanks [@SamHemingway](https://github.com/SamHemingway)! - Fix deleted documents being recreated as empty drafts when `defaultLanguages` is configured. The auto-add effect now only patches documents that exist in the dataset (have a `_rev`) and skips documents the pane reports as deleted. This also means new documents no longer get a draft created just by opening the form — default languages are added after the user's first edit.

- [#964](https://github.com/sanity-io/plugins/pull/964) [`4226408`](https://github.com/sanity-io/plugins/commit/4226408594d2717cf2503866f5d5216991701d38) Thanks [@stipsan](https://github.com/stipsan)! - Update `@sanity/util` dependency to v6, in line with Sanity Studio v6

## 5.1.4

## 5.1.3

### Patch Changes

- [#903](https://github.com/sanity-io/plugins/pull/903) [`2f03c8d`](https://github.com/sanity-io/plugins/commit/2f03c8d98039c29b9d4fd9bc6cd7c09c909c8cc4) Thanks [@bjoerge](https://github.com/bjoerge)! - Widen `sanity` peer-dependency range to `^5 || ^6.0.0-0` to support Sanity Studio v6 (including v6 pre-releases).

## 5.1.2

### Patch Changes

- [#869](https://github.com/sanity-io/plugins/pull/869) [`2a3f19d`](https://github.com/sanity-io/plugins/commit/2a3f19d835dbc75e79cce2a0ccd72b3c561170dd) Thanks [@renovate](https://github.com/apps/renovate)! - Replace deprecated `space` prop with `gap` and `columns` with `gridTemplateColumns` to address @sanity/ui v3.2.0 deprecation warnings

## 5.1.1

### Patch Changes

- [`d37a6cb`](https://github.com/sanity-io/plugins/commit/d37a6cb1792745be66349201f7e9815daae3be38) Thanks [@jordanl17](https://github.com/jordanl17)! - Fix document-level read-only state not being respected by add-language buttons and field actions

- [#761](https://github.com/sanity-io/plugins/pull/761) [`7c3fdff`](https://github.com/sanity-io/plugins/commit/7c3fdff43eb28417c8e02ae0523f9f95248fc012) Thanks [@jjburbridge](https://github.com/jjburbridge)! - Object to Array Migration script update to match v5

## 5.1.0

### Minor Changes

- [#774](https://github.com/sanity-io/plugins/pull/774) [`3a65363`](https://github.com/sanity-io/plugins/commit/3a65363e53045c3b21f3a2dce0801e5dbd1d8fa6) Thanks [@pedrobonamin](https://github.com/pedrobonamin)! - Add support for configuring default languages in internationalized arrays language filter.

## 5.0.5

### Patch Changes

- [#779](https://github.com/sanity-io/plugins/pull/779) [`f7f610f`](https://github.com/sanity-io/plugins/commit/f7f610f9866a09c8f4d411a030473186e5a265c1) Thanks [@pedrobonamin](https://github.com/pedrobonamin)! - Require `@sanity/language-filter` v5.

## 5.0.4

### Patch Changes

- [#773](https://github.com/sanity-io/plugins/pull/773) [`e14f460`](https://github.com/sanity-io/plugins/commit/e14f460d237686e4367d6c8d935ec31966186213) Thanks [@pedrobonamin](https://github.com/pedrobonamin)! - Fix custom object (and other) input components not rendering for types registered in the plugin `fieldTypes`. The inner `value` field no longer overrides `components.field`, so Studio shows your custom input inside each language row again.
  Now, internationalized array inputs will have the option to add comments, show validation, and field actions.

## 5.0.3

### Patch Changes

- [#741](https://github.com/sanity-io/plugins/pull/741) [`5a1bea4`](https://github.com/sanity-io/plugins/commit/5a1bea46d82aa69192e63313552014f51f2a52d2) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): Update dependency @sanity/ui to ^3.1.14

## 5.0.2

## 5.0.1

### Patch Changes

- [#719](https://github.com/sanity-io/plugins/pull/719) [`9ebd48c`](https://github.com/sanity-io/plugins/commit/9ebd48c91ee8501e365f01de3246e83a5e763180) Thanks [@pedrobonamin](https://github.com/pedrobonamin)! - Prevent stack overflow when traversing document schemas that contain circular inline object/array nesting.

## 5.0.0

### Major Changes

- [#567](https://github.com/sanity-io/plugins/pull/567) [`5afde33`](https://github.com/sanity-io/plugins/commit/5afde33e9d06225347896712ab28ad20c030b2df) Thanks [@pedrobonamin](https://github.com/pedrobonamin)! - Move language identifier from `_key` to dedicated `language` field.

  **Breaking change**: Internationalized array items now store the language identifier in a `language` field instead of `_key`. The `_key` field is now a random unique ID.

  **Before (v4):**

  ```json
  {"_key": "en", "value": "hello"}
  ```

  **After (v5):**

  ```json
  {"_key": "abc123", "language": "en", "value": "hello"}
  ```

  ## How to upgrade

  Full details in [README Migrate from v4 to v5](https://github.com/sanity-io/plugins/blob/main/plugins/sanity-plugin-internationalized-array/README.md#migrate-from-v4-to-v5) section of the README.

  1. Update GROQ queries from `_key == "en"` to `language == "en"  || _key == "en"` until the migration is completed.
  2. Run the new bundled migration helper to update existing documents. Create a migration file in your project that imports from `sanity-plugin-internationalized-array/migrations`, configures your `documentTypes`, and exports the migration:

     ```ts
     // ./migrations/migrateToLanguageField.ts
     import {migrateToLanguageField} from 'sanity-plugin-internationalized-array/migrations'
     export default migrateToLanguageField(['yourType'])
     ```

     ```bash
     npx sanity migration run migrateToLanguageField
     ```

     Verify everything looks as expected

     ```bash
     npx sanity migration run migrateToLanguageField  --no-dry-run
     ```

  3. Update any custom code that reads `_key` as the language identifier to use the `language` field instead.
  4. Remove `_key == "en"` from your queries once migration is complete, since language is now stored in `language`.

  ## Usage with language filter

  The plugin now includes built-in integration with `@sanity/language-filter`.
  To enable it, add `languageFilter.documentTypes` in the plugin config for the document types that should show the filter.

  ```ts
  import {defineConfig} from 'sanity'
  import {internationalizedArray} from 'sanity-plugin-internationalized-array'

  export default defineConfig({
    // ...
    plugins: [
      internationalizedArray({
        languages: [
          {id: 'en', title: 'English'},
          {id: 'fr', title: 'French'},
        ],
        defaultLanguages: ['en'],
        fieldTypes: ['string'],
        languageFilter: {
          documentTypes: ['internationalizedPost', 'lesson'],
        },
      }),
    ],
  })
  ```

## 4.0.6

### Patch Changes

- [#712](https://github.com/sanity-io/plugins/pull/712) [`bf6a7d5`](https://github.com/sanity-io/plugins/commit/bf6a7d531875bf43e11f4df57f680d839b36e4f5) Thanks [@pedrobonamin](https://github.com/pedrobonamin)! - Update `@sanity/language-filter` to `4.1.0` and adjust language segment matching to pass the current item value, updating language filtering behavior with the new parameter.

  Now when using language filter in the internationalized array you will receive a 4th parameter with the value of the object containing the field you are trying to filter.
  For example:

  ```ts
  {
      _key: "en",
      value: "Hello world"
  }
  ```

## 4.0.5

### Patch Changes

- [#677](https://github.com/sanity-io/plugins/pull/677) [`1f8fe29`](https://github.com/sanity-io/plugins/commit/1f8fe2964767506dc85a1e44baf7eedbe6023ab2) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Remove unused dependency `fast-deep-equal`. Clean up internal cache module by removing dead code (exported functions that were never imported).

## 4.0.4

### Patch Changes

- [#624](https://github.com/sanity-io/plugins/pull/624) [`dbfe998`](https://github.com/sanity-io/plugins/commit/dbfe9982f69f173cc67bcec0a3a38ca57cd9dcb8) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Import lodash-es functions from subpaths instead of barrel export for better performance

- [#633](https://github.com/sanity-io/plugins/pull/633) [`cdef1a3`](https://github.com/sanity-io/plugins/commit/cdef1a3dd351d3b4e3783937b7d65090adabaf75) Thanks [@pedrobonamin](https://github.com/pedrobonamin)! - # Changes

  Improve form performance by reducing unnecessary subscriptions and on-render work, including on-demand form value reads and targeted document-level translation scanning. Also align form/layout handling with shared document-type guards so integration with translation metadata is more predictable.

## 4.0.3

### Patch Changes

- [#582](https://github.com/sanity-io/plugins/pull/582) [`d4e3d2b`](https://github.com/sanity-io/plugins/commit/d4e3d2baad5964c6a1f17adba590c7ac301744af) Thanks [@pedrobonamin](https://github.com/pedrobonamin)! - Refactor internal code to use `LANGUAGE_FIELD_NAME` constant instead of hardcoded `_key` references

## 4.0.2

### Patch Changes

- [#584](https://github.com/sanity-io/plugins/pull/584) [`c878cf5`](https://github.com/sanity-io/plugins/commit/c878cf57e8fac91c2112375dcd4ddd5a5e01ba16) Thanks [@pedrobonamin](https://github.com/pedrobonamin)! - Fix the "Add all languages" action so it only inserts missing language items.

- [#581](https://github.com/sanity-io/plugins/pull/581) [`952a50b`](https://github.com/sanity-io/plugins/commit/952a50b1735b05da60d13f52c33428a5b1955a57) Thanks [@pedrobonamin](https://github.com/pedrobonamin)! - Export `InternationalizedArrayItem` from the package so it can be imported and reused by consumers.

- [#576](https://github.com/sanity-io/plugins/pull/576) [`88c8e2d`](https://github.com/sanity-io/plugins/commit/88c8e2d717f1fb2314ae65b7dd3853a9f07fd246) Thanks [@pedrobonamin](https://github.com/pedrobonamin)! - Export `LANGUAGE_FIELD_NAME` constant

## 4.0.1

### Patch Changes

- [#548](https://github.com/sanity-io/plugins/pull/548) [`b942552`](https://github.com/sanity-io/plugins/commit/b942552b83117c95a73fddb21bd0453497fe883b) Thanks [@pedrobonamin](https://github.com/pedrobonamin)! - Introduce `LANGUAGE_FIELD_NAME` constant for language identification

  This is an internal refactor that centralizes how language identification is handled in internationalized array items. No user-facing changes - the plugin functions identically to before.

  This prepares the codebase for a future migration from storing language IDs in `_key` to a dedicated `language` field.

## 4.0.0

### Major Changes

- [#493](https://github.com/sanity-io/plugins/pull/493) [`4d9e6bb`](https://github.com/sanity-io/plugins/commit/4d9e6bb044c80db8cec386e36fcddab94d5102f5) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Port sanity-plugin-internationalized-array to the Sanity plugins monorepo

  This major release includes several breaking changes as part of the migration to the monorepo:

  - **React Compiler enabled**: The plugin is now optimized with React Compiler for better performance
  - **ESM-only**: CommonJS is no longer supported (removed dual module format)
  - **Sanity Studio v5 required**: The plugin now requires Sanity Studio v5 as the baseline
  - **React 19 required**: Updated to support React 19.2+
  - **Stricter TypeScript**: Updated type definitions with improved type safety
  - **Updated dependencies**: All dependencies updated to latest compatible versions

  The plugin functionality remains the same, but the new build process and dependencies require these breaking changes for compatibility with the monorepo's tooling and conventions.

### Patch Changes

- [#525](https://github.com/sanity-io/plugins/pull/525) [`575e069`](https://github.com/sanity-io/plugins/commit/575e069e30b0a0e18a2e14812439c8dd8877ee58) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): Update dependency @sanity/icons to ^3.7.4

- [#530](https://github.com/sanity-io/plugins/pull/530) [`7e825c1`](https://github.com/sanity-io/plugins/commit/7e825c1d987b282d3a63c094ab2429cbd0519c14) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): Update dependency @sanity/language-filter to ^4.0.6

- [#533](https://github.com/sanity-io/plugins/pull/533) [`a019be6`](https://github.com/sanity-io/plugins/commit/a019be65598d5bad6b5654551e8da569c22ab703) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): Update dependency lodash-es to ^4.17.23

- [#526](https://github.com/sanity-io/plugins/pull/526) [`ea2b950`](https://github.com/sanity-io/plugins/commit/ea2b950a287b4f1b1c212b68ebb936e3bec2f051) Thanks [@pedrobonamin](https://github.com/pedrobonamin)! - Fix "restore order" action on read-only documents

  Previously, the automatic "restore order" action would attempt to patch read-only documents, resulting in an error. The action now checks the document's read-only status before executing.

## [3.2.2](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v3.2.1...v3.2.2) (2025-12-17)

### Bug Fixes

- **deps:** allow sanity v5 as peer dependency ([#110](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/110)) ([c46b07d](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/c46b07d30609b10b76ef2f0cb0771386ebbf9dbf))

## [3.2.1](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v3.2.0...v3.2.1) (2025-12-09)

### Bug Fixes

- added prop & check for readonly status of the document ([#109](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/109)) ([4469ef1](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/4469ef1b016e4d2c0c9c4db39d3df06aa0272a2c))

## [3.2.0](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v3.1.6...v3.2.0) (2025-10-17)

### Features

- support raw perspective with updated api version ([#108](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/108)) ([fed49e4](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/fed49e4db32476c8ed7137a67f955a0a6f4267c1))

## [3.1.6](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v3.1.5...v3.1.6) (2025-10-13)

### Bug Fixes

- initialize array fields with empty array to prevent insert patch error ([#105](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/105)) ([9072757](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/9072757bcba93a3bca2f1071ab390f127912594c)), closes [#2](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/2)

## [3.1.5](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v3.1.4...v3.1.5) (2025-08-14)

### Bug Fixes

- async caching ([#101](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/101)) ([6d10154](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/6d10154e75c7ae48b528a8d135ad1be6848f316c))

## [3.1.4](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v3.1.3...v3.1.4) (2025-07-10)

### Bug Fixes

- **deps:** allow studio v4 in peer dep ranges + update main ([7aaf76c](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/7aaf76c21f6fa6f023151744861c5e3380aee54e))

## [3.1.3](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v3.1.2...v3.1.3) (2025-04-28)

### Bug Fixes

- resolve markdown field rendering issue ([#97](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/97)) ([4e85b95](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/4e85b95760b213b5b3b92f1838a75ae790553a7c))

## [3.1.2](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v3.1.1...v3.1.2) (2025-03-12)

### Bug Fixes

- strict mode issue ([d2479a2](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/d2479a2bbcc1cc997a8f9965836935044c68661f)), closes [#80](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/80)

## [3.1.1](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v3.1.0...v3.1.1) (2025-01-09)

### Bug Fixes

- default languages ([#95](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/95)) ([db9f5e1](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/db9f5e1b08ad67ae39fc1a781ceb5f313dabc7ca))

## [3.1.0](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v3.0.3...v3.1.0) (2024-12-23)

### Features

- force release ([#94](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/94)) ([46236b1](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/46236b1b6efc22a6b792562c4830466dd598255e))

## [3.0.3](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v3.0.2...v3.0.3) (2024-12-17)

### Bug Fixes

- support react 19 ([#91](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/91)) ([67572ea](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/67572ea70bde1253618d2bf5a82008f04e55f70a))

## [3.0.2](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v3.0.1...v3.0.2) (2024-11-11)

### Bug Fixes

- array field extraction. closes [#48](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/48) ([#84](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/84)) ([da4dbf6](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/da4dbf64b110c7d3889d184d81146705c3e0905f))

## [3.0.1](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v3.0.0...v3.0.1) (2024-09-21)

### Bug Fixes

- prevent an unnecessary patch to set default languages on document deletion event ([#78](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/78)) ([285d71e](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/285d71e03a5612ba4398dfccb2e4bd7ca5f682e0))

## [3.0.0](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v2.1.0...v3.0.0) (2024-08-06)

### ⚠ BREAKING CHANGES

- improve performance & bump deps (#76)

### Bug Fixes

- improve performance & bump deps ([#76](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/76)) ([7551e51](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/7551e510a5ae30187c82402318f0d9dd1cb9f612))

## [2.1.0](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v2.0.0...v2.1.0) (2024-08-05)

### Features

- add recursive translate support ([#75](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/75)) ([550af9f](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/550af9fb18105549b331dea03cc8195f8fcd1e25)), closes [#1558](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/1558) [#1558](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/1558) [#1558](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/1558) [#1558](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/1558) [#1558](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/1558) [#1558](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/1558) [#1558](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/1558) [#1558](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/1558) [#1558](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/1558) [#1558](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/1558) [#1558](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/1558) [#1558](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/1558) [#1558](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/1558) [#1558](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/1558) [#1558](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/1558) [#1558](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/1558) [#1558](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/1558) [#1558](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/1558)

## [2.0.0](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v1.10.9...v2.0.0) (2024-04-09)

### ⚠ BREAKING CHANGES

- support strict ESM
- use `sanity/structure` imports over `sanity/desk`

### Features

- support strict ESM ([ea18449](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/ea184490d5e712271df161bbc1a12412ba055e30))

### Bug Fixes

- reinit languages on workspace switch ([cc1b625](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/cc1b62514137409fbdcfc03c8e1f2a189a93dd8d))
- use `sanity/structure` imports over `sanity/desk` ([6b2515c](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/6b2515c8ff2269073e351c5e24984259fec2efee))

## [1.10.9](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v1.10.8...v1.10.9) (2024-03-05)

### Bug Fixes

- address issues outlined in [#47](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/47) ([0183721](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/0183721513ad69c1354317316207e7912e94d2c0))

## [1.10.8](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v1.10.7...v1.10.8) (2024-01-25)

### Bug Fixes

- restore field action ([bb2c354](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/bb2c3541d9361e688717e48eccdd55f96a5d2ab2))

## [1.10.7](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v1.10.6...v1.10.7) (2024-01-19)

### Bug Fixes

- update package-lock.json ([35885aa](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/35885aaafcb52662dda00510de8ca1fecb107f9f))

## [1.10.6](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v1.10.5...v1.10.6) (2024-01-19)

### Bug Fixes

- update dependencies ([569d370](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/569d3704ef16fced8bb1ad5ffd29bbbbc5984105))

## [1.10.5](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v1.10.4...v1.10.5) (2024-01-18)

### Bug Fixes

- recursive lookup for field options ([20d449a](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/20d449a948907f79ee0708b0af635618b596fdbb))

## [1.10.4](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v1.10.3...v1.10.4) (2024-01-05)

### Bug Fixes

- **deps:** widen @sanity/ui peer dependency range ([737a274](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/737a274128d0eef2a7354149e185355bef8cc8cb))

## [1.10.3](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v1.10.2...v1.10.3) (2023-09-11)

### Bug Fixes

- default language setting was preventing existing documents from being deleted properly ([6b4d5db](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/6b4d5dbbdc888cdfc8c17039ac371138b1960898))

## [1.10.2](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v1.10.1...v1.10.2) (2023-08-30)

### Bug Fixes

- ensure 'fields' is present in array ([a8447f2](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/a8447f24e4451dec181cd12c562d8a5ed528c52e))
- recursive array fields check ([f1c895a](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/f1c895ab8b0b9c376f799f9f106ec29c0c2cb283))

## [1.10.1](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v1.10.0...v1.10.1) (2023-07-20)

### Bug Fixes

- field actions display name not id ([b4c4435](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/b4c44356b1985fe0565e914afe377362dd04acae))
- prevent defaultLanguages from recreating a document when deleted ([9f06e11](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/9f06e11fde19a0050192425a8de35ddc8ddf61f7))

## [1.10.0](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v1.9.1...v1.10.0) (2023-07-13)

### Features

- render item error instead of returning null ([1653e2e](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/1653e2eda4f6983293f7121a65c6fe68440f5b2c))

### Bug Fixes

- forward all props to ArrayOfObjectsItem to solve portable text issue ([#15](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/15)) ([5389761](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/53897619a6d5d8c1c251d693ddea05b4857d7396))

## [1.9.1](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v1.9.0...v1.9.1) (2023-07-12)

### Bug Fixes

- better guidance for internationalized array filter ([56da117](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/56da1170727feb839c481963ee126b585a17e58b))
- dynamic languages ([ced82c1](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/ced82c17140ae215f3d70fc0924c416d02a05903))
- perform recursive search for intArray fields ([3441ce1](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/3441ce1b0814cfddf8bc4c10ba2e6f264f14091c))

## [1.9.0](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v1.8.0...v1.9.0) (2023-07-12)

### Features

- add document-level button action ([0b9412f](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/0b9412fb28a775145cc73a7a261c8e972f10d433))

## [1.8.0](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v1.7.0...v1.8.0) (2023-07-10)

### Features

- add 'add all' button to field actions ([f99bea1](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/f99bea10a9f4f9c7d6aeeaaea769fc7a6684f427))
- setup field actions ([6193375](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/6193375cdd1d0d13e305c2ffb14f78e639752120))
- update dividers and 'all' button in field actions ([1a5010b](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/1a5010b50f5d351a784a238e18202e2102d40ddc))

### Bug Fixes

- remove divider action ([0fb57e5](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/0fb57e5a3b2cf141df7eb10ffe82799ed9ba921f))

## [1.7.0](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v1.6.2...v1.7.0) (2023-06-19)

### Features

- support language-filter and defaultLanguages ([dae1dea](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/dae1dea5f27ef86861ea128ab37b6c1498597551))

## [1.6.2](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v1.6.1...v1.6.2) (2023-06-01)

### Bug Fixes

- update screenshot ([ce00756](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/ce0075606d3bc58af85d54648999b3d055681f82))

## [1.6.1](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v1.6.0...v1.6.1) (2023-04-13)

### Bug Fixes

- update husky ([8f243b5](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/8f243b52d59b5c4503c71d7ef743831b624fa59d))
- update semver preset + packages ([4e8d930](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/4e8d930958621c6bc6a1aead6de3e5f0ca5a35e7))

## [1.6.0](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v1.5.0...v1.6.0) (2023-01-25)

### Features

- dynamic languages based on document ([#7](https://github.com/sanity-io/sanity-plugin-internationalized-array/issues/7)) ([ad9ae61](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/ad9ae6153821cd6f791f0eae23026dfb47ede8c5))

## [1.5.0](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v1.4.1...v1.5.0) (2022-12-09)

### Features

- use suspense for data fetching ([72de31b](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/72de31bfc3de28c56b905e98754c154187f0f760))

### Bug Fixes

- `@sanity/ui` should be a regular dep ([9507a30](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/9507a30a600a345359829b301ad7250163d9be49))
- add `clear` export from `cache` ([b706cc8](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/b706cc8072d478d3dfe2ed13adc926ae42a9f1a5))
- add all exports ([cf537e7](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/cf537e770696f81f3bc8d6eca86fb8ec12471371))
- bump dependencies ([c20cd24](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/c20cd24cb2de44cc18054a2c494f25531288731f))
- preload the language list fetching ([9a1f8f4](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/9a1f8f426bd7bb0906332098b97befbd8ea1c324))
- styled-components should be a peer dep ([c48b310](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/c48b310f1424bedf038027a737f9f302354772a5))
- update semver range for `sanity` ([69a4441](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/69a44412f207414e847074ce3dfa8fd81594f346))

## [1.4.1](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v1.4.0...v1.4.1) (2022-11-25)

### Bug Fixes

- change 'remove' button ([f4e9de8](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/f4e9de863a3f3c2c0a25d81f64357c3422892902))

## [1.4.0](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v1.3.3...v1.4.0) (2022-11-25)

### Features

- async language option ([2b64476](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/2b644766df0411edfae85bad090d57ed7a12957e))

## [1.3.3](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v1.3.2...v1.3.3) (2022-11-21)

### Bug Fixes

- show full reference field preview ([f3d3b25](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/f3d3b25e09e5c35e24c6b6d6edef5555f5ecfe41))

## [1.3.2](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v1.3.1...v1.3.2) (2022-11-21)

### Bug Fixes

- render reference value as a preview ([af2f2c5](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/af2f2c5df1b059c4b520377174cb2c49b943e9f7))

## [1.3.1](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v1.3.0...v1.3.1) (2022-11-19)

### Bug Fixes

- render 'value' inputs without title ([7e55384](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/7e55384ebe9ec536b4cf2de67b7495d6e2f578de))

## [1.3.0](https://github.com/sanity-io/sanity-plugin-internationalized-array/compare/v1.2.0...v1.3.0) (2022-11-19)

### Features

- prompt new version, fix readme typo ([9dda8e4](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/9dda8e44b213e57dbee5436b1b50c578b99f0f52))

### Bug Fixes

- merges from main ([08fcb5d](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/08fcb5db692cee890d46c730d4f26e182c92a26d))

## 1.0.0 (2022-11-19)

### Bug Fixes

- add preview value to object ([2332c2c](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/2332c2cbc83f5e74210100d90c58b70897861c57))
- remove all table markup ([1753a40](https://github.com/sanity-io/sanity-plugin-internationalized-array/commit/1753a402ab00f09b253a92dbfe45a355a0915999))
