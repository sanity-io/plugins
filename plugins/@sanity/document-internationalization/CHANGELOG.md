# @sanity/document-internationalization

## 6.2.9

### Patch Changes

- [#1304](https://github.com/sanity-io/plugins/pull/1304) [`5d2195a`](https://github.com/sanity-io/plugins/commit/5d2195a8b56b1907391a6bfb9cff9ca5448bc9dc) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency @sanity/uuid to ^3.0.3

## 6.2.8

## 6.2.7

### Patch Changes

- [`7a37fd1`](https://github.com/sanity-io/plugins/commit/7a37fd1653681de5f892de2dea29b83e9b119ff1) Thanks [@stipsan](https://github.com/stipsan)! - use `workspace:^` for prod deps

- [`68fb45a`](https://github.com/sanity-io/plugins/commit/68fb45ae05271006813424506fb995cc84f79885) Thanks [@stipsan](https://github.com/stipsan)! - Use concistent peer dep definition

- Updated dependencies [[`7c1a95c`](https://github.com/sanity-io/plugins/commit/7c1a95c2213555c50bca2fde2af3590abc57c444)]:
  - sanity-plugin-utils@2.0.3

## 6.2.6

### Patch Changes

- Updated dependencies [[`c66b926`](https://github.com/sanity-io/plugins/commit/c66b9269394b2ec45c320580a39069e6fd39dd4d)]:
  - sanity-plugin-utils@2.0.2

## 6.2.5

### Patch Changes

- [#980](https://github.com/sanity-io/plugins/pull/980) [`98d148e`](https://github.com/sanity-io/plugins/commit/98d148e00ef679b422e1effe7fc53dfce9cb046c) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Update `@sanity/pkg-utils` to pick up a DTS generation bug fix.

- Updated dependencies [[`98d148e`](https://github.com/sanity-io/plugins/commit/98d148e00ef679b422e1effe7fc53dfce9cb046c)]:
  - sanity-plugin-utils@2.0.1

## 6.2.4

### Patch Changes

- [#964](https://github.com/sanity-io/plugins/pull/964) [`4226408`](https://github.com/sanity-io/plugins/commit/4226408594d2717cf2503866f5d5216991701d38) Thanks [@stipsan](https://github.com/stipsan)! - Update `@sanity/mutator` and `@sanity/util` dependencies to v6, in line with Sanity Studio v6

## 6.2.3

## 6.2.2

### Patch Changes

- Updated dependencies [[`cd2bc3c`](https://github.com/sanity-io/plugins/commit/cd2bc3c3e39c3cb357dd456bc205d1d6d57f441a)]:
  - sanity-plugin-utils@2.0.0

## 6.2.1

### Patch Changes

- [#903](https://github.com/sanity-io/plugins/pull/903) [`2f03c8d`](https://github.com/sanity-io/plugins/commit/2f03c8d98039c29b9d4fd9bc6cd7c09c909c8cc4) Thanks [@bjoerge](https://github.com/bjoerge)! - Widen `sanity` peer-dependency range to `^5 || ^6.0.0-0` to support Sanity Studio v6 (including v6 pre-releases).

## 6.2.0

### Minor Changes

- [#893](https://github.com/sanity-io/plugins/pull/893) [`83f7d74`](https://github.com/sanity-io/plugins/commit/83f7d74602069e0e2e5553b24285c684a9768b9c) Thanks [@RobbertST](https://github.com/RobbertST)! - Add a `metadataOmnisearchVisibility` option to control whether translation metadata documents appear in Omnisearch.

## 6.1.2

### Patch Changes

- [#869](https://github.com/sanity-io/plugins/pull/869) [`2a3f19d`](https://github.com/sanity-io/plugins/commit/2a3f19d835dbc75e79cce2a0ccd72b3c561170dd) Thanks [@renovate](https://github.com/apps/renovate)! - Replace deprecated `space` prop with `gap` and `columns` with `gridTemplateColumns` to address @sanity/ui v3.2.0 deprecation warnings

## 6.1.1

## 6.1.0

### Minor Changes

- [#780](https://github.com/sanity-io/plugins/pull/780) [`c6463af`](https://github.com/sanity-io/plugins/commit/c6463affecf89c5efad2714a510b0e784c5b1d1a) Thanks [@Jamiewarb](https://github.com/Jamiewarb)! - Add support for disabling the automatic template creation via the `addTemplates` config option

## 6.0.6

## 6.0.5

## 6.0.4

## 6.0.3

### Patch Changes

- [#740](https://github.com/sanity-io/plugins/pull/740) [`3f68f56`](https://github.com/sanity-io/plugins/commit/3f68f5605075409de4a76bfff51d96f7ead0a20e) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): Update dependency @sanity/mutator to ^5.16.0

- [#741](https://github.com/sanity-io/plugins/pull/741) [`5a1bea4`](https://github.com/sanity-io/plugins/commit/5a1bea46d82aa69192e63313552014f51f2a52d2) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): Update dependency @sanity/ui to ^3.1.14

## 6.0.2

## 6.0.1

## 6.0.0

### Major Changes

- [#567](https://github.com/sanity-io/plugins/pull/567) [`5afde33`](https://github.com/sanity-io/plugins/commit/5afde33e9d06225347896712ab28ad20c030b2df) Thanks [@pedrobonamin](https://github.com/pedrobonamin)! - Support `sanity-plugin-internationalized-array` v5 `language` field format.

  **Breaking change:** Translation reference items in `translation.metadata` documents now use a dedicated `language` field instead of `_key` for the language identifier. The `_key` is now a random unique ID.

  **How to upgrade:**

  1. Update `sanity-plugin-internationalized-array` to v5 first.
  2. Backup your data.
  3. Create a migration file using the new bundled helper from `sanity-plugin-internationalized-array/migrations`, and **include `'translation.metadata'` in your `documentTypes` array** so translation metadata documents are also migrated:

     ```ts
     // ./migrations/migrateToLanguageField.ts
     import {migrateToLanguageField} from 'sanity-plugin-internationalized-array/migrations'
     export default migrateToLanguageField(['yourType', 'translation.metadata'])
     ```

     ```bash
     npx sanity migration run migrateToLanguageField
     ```

     Verify everything looks as expected

     ```bash
     npx sanity migration run migrateToLanguageField   --no-dry-run
     ```

  4. If you have custom code that reads `translation._key` to identify languages, update it to use `translation.language` instead.
  5. If you use the legacy action exports (`DeleteTranslationAction`, `DuplicateWithTranslationsAction`), migrate to the hook-based replacements (`useDeleteTranslationAction`, `useDuplicateWithTranslationsAction`).

## 5.1.3

## 5.1.2

## 5.1.1

### Patch Changes

- [#606](https://github.com/sanity-io/plugins/pull/606) [`173c0a1`](https://github.com/sanity-io/plugins/commit/173c0a193e3e385b0b5c9dbf0f011bf224e0ca9e) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): Update dependency rxjs to ^7.8.2

- [#607](https://github.com/sanity-io/plugins/pull/607) [`1dd3276`](https://github.com/sanity-io/plugins/commit/1dd327644e4e024b2e652ddc41b8bad076d2e5b3) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): Update dependency sanity-plugin-utils to ^1.8.0

- [#633](https://github.com/sanity-io/plugins/pull/633) [`cdef1a3`](https://github.com/sanity-io/plugins/commit/cdef1a3dd351d3b4e3783937b7d65090adabaf75) Thanks [@pedrobonamin](https://github.com/pedrobonamin)! - # Changes

  Configure the internal internationalized-array integration with an explicit integration mode so translation metadata documents use the correct plugin wiring while non-metadata documents avoid unnecessary wrapping.

## 5.1.0

### Minor Changes

- [#593](https://github.com/sanity-io/plugins/pull/593) [`80e58e9`](https://github.com/sanity-io/plugins/commit/80e58e9d0c2b463333c952a73c18c163d5595c8c) Thanks [@SamHemingway](https://github.com/SamHemingway)! - Add `hideLanguageFilter` config option to hide the language filter in the document editor toolbar. Supports `boolean`, `string[]` (schema type names), or a callback function for dynamic control.

## 5.0.2

### Patch Changes

- [#582](https://github.com/sanity-io/plugins/pull/582) [`d4e3d2b`](https://github.com/sanity-io/plugins/commit/d4e3d2baad5964c6a1f17adba590c7ac301744af) Thanks [@pedrobonamin](https://github.com/pedrobonamin)! - Use `LANGUAGE_FIELD_NAME` constant from `sanity-plugin-internationalized-array` instead of hardcoded `_key` references

## 5.0.1

### Patch Changes

- [#581](https://github.com/sanity-io/plugins/pull/581) [`952a50b`](https://github.com/sanity-io/plugins/commit/952a50b1735b05da60d13f52c33428a5b1955a57) Thanks [@pedrobonamin](https://github.com/pedrobonamin)! - Update the plugin to consume the exported `InternationalizedArrayItem` type from `sanity-plugin-internationalized-array`.

- [#576](https://github.com/sanity-io/plugins/pull/576) [`88c8e2d`](https://github.com/sanity-io/plugins/commit/88c8e2d717f1fb2314ae65b7dd3853a9f07fd246) Thanks [@pedrobonamin](https://github.com/pedrobonamin)! - Deprecate the legacy `DeleteTranslationAction` and `DuplicateWithTranslationsAction` action exports. Use the hook-based actions instead: `useDeleteTranslationAction` and `useDuplicateWithTranslationsAction`.

  To insert the hook-based actions, add them in your Studio `document.actions` configuration:

  ```ts
  import {
    useDeleteTranslationAction,
    useDuplicateWithTranslationsAction,
  } from '@sanity/document-internationalization'

  export default defineConfig({
    // ...
    document: {
      actions: (prev, context) => {
        const translatedSchemaTypes = ['lesson', 'article']

        if (translatedSchemaTypes.includes(context.schemaType)) {
          return [...prev, useDeleteTranslationAction, useDuplicateWithTranslationsAction]
        }

        return prev
      },
    },
  })
  ```

## 5.0.0

### Major Changes

- [#562](https://github.com/sanity-io/plugins/pull/562) [`bc342c5`](https://github.com/sanity-io/plugins/commit/bc342c59a49810ae6289546af049a8c3a8a57e43) Thanks [@pedrobonamin](https://github.com/pedrobonamin)! - Port @sanity/document-internationalization to the Sanity plugins monorepo

  This major release includes several breaking changes as part of the migration to the monorepo:

  - **React Compiler enabled**: The plugin is now optimized with React Compiler for better performance
  - **ESM-only**: CommonJS is no longer supported (removed dual module format)
  - **Sanity Studio v5 required**: The plugin now requires Sanity Studio v5 as the baseline
  - **React 19 required**: Updated to support React 19.2+
  - **Stricter TypeScript**: Updated type definitions with improved type safety
  - **Updated dependencies**: All dependencies updated to latest compatible versions

  The plugin functionality remains the same, but the new build process and dependencies require these breaking changes for compatibility with the monorepo's tooling and conventions.

### Patch Changes

- Updated dependencies [[`b942552`](https://github.com/sanity-io/plugins/commit/b942552b83117c95a73fddb21bd0453497fe883b)]:
  - sanity-plugin-internationalized-array@4.0.1

## [4.1.1](https://github.com/sanity-io/document-internationalization/compare/v4.1.0...v4.1.1) (2025-12-17)

### Bug Fixes

- **deps:** allow sanity v5 as peer dependency ([#212](https://github.com/sanity-io/document-internationalization/issues/212)) ([4aea849](https://github.com/sanity-io/document-internationalization/commit/4aea8493b2fa4d2b315c6a0a1eee2db679b00e84))

## [4.1.0](https://github.com/sanity-io/document-internationalization/compare/v4.0.0...v4.1.0) (2025-10-17)

### Features

- bump internationalized-array plugin version to 3.2.0 ([#210](https://github.com/sanity-io/document-internationalization/issues/210)) ([ac72d56](https://github.com/sanity-io/document-internationalization/commit/ac72d56e437486cfcd37f4a9dec3222000d79cef))

## [4.0.0](https://github.com/sanity-io/document-internationalization/compare/v3.3.3...v4.0.0) (2025-07-31)

### ⚠ BREAKING CHANGES

- **deps:** update dependency @sanity/ui to v3 (#207)

### Bug Fixes

- **deps:** update dependency @sanity/ui to v3 ([#207](https://github.com/sanity-io/document-internationalization/issues/207)) ([2f90981](https://github.com/sanity-io/document-internationalization/commit/2f90981d7aeb1355d64229ee024c81aefd45e1d4))

## [3.3.3](https://github.com/sanity-io/document-internationalization/compare/v3.3.2...v3.3.3) (2025-07-10)

### Bug Fixes

- **deps:** allow studio v4 in peer dep ranges + update main.yml ([#206](https://github.com/sanity-io/document-internationalization/issues/206)) ([0d15452](https://github.com/sanity-io/document-internationalization/commit/0d15452e85c0aef00a82f65e1541ee600e0705d5))

## [3.3.2](https://github.com/sanity-io/document-internationalization/compare/v3.3.1...v3.3.2) (2025-06-23)

### Bug Fixes

- bump API version ([#204](https://github.com/sanity-io/document-internationalization/issues/204)) ([9cd8f67](https://github.com/sanity-io/document-internationalization/commit/9cd8f6760551bed1cb0aae0a6e79c5ca2741fa74))

## [3.3.1](https://github.com/sanity-io/document-internationalization/compare/v3.3.0...v3.3.1) (2025-01-07)

### Bug Fixes

- re-add mutator to dependencies ([#202](https://github.com/sanity-io/document-internationalization/issues/202)) ([9a26ec9](https://github.com/sanity-io/document-internationalization/commit/9a26ec91fe48c3513c180e8fd3fb747f96014074))

## [3.3.0](https://github.com/sanity-io/document-internationalization/compare/v3.2.1...v3.3.0) (2024-12-20)

### Features

- adds callback function ([#198](https://github.com/sanity-io/document-internationalization/issues/198)) ([67bd80a](https://github.com/sanity-io/document-internationalization/commit/67bd80a477552a16f0ee3c382e997fe8d237dd1c))

## [3.2.1](https://github.com/sanity-io/document-internationalization/compare/v3.2.0...v3.2.1) (2024-12-18)

### Bug Fixes

- support react 19 ([#197](https://github.com/sanity-io/document-internationalization/issues/197)) ([913558a](https://github.com/sanity-io/document-internationalization/commit/913558a30522d7ed2220359013d7ce1f17d62db3)), closes [#196](https://github.com/sanity-io/document-internationalization/issues/196)

## [3.2.0](https://github.com/sanity-io/document-internationalization/compare/v3.1.0...v3.2.0) (2024-11-19)

### Features

- add duplicate document action ([#194](https://github.com/sanity-io/document-internationalization/issues/194)) ([087415d](https://github.com/sanity-io/document-internationalization/commit/087415dd7258c7ded77ef8e0135069fe6e584868))

## [3.1.0](https://github.com/sanity-io/document-internationalization/compare/v3.0.1...v3.1.0) (2024-09-27)

### Features

- manage without translations ([578a9a0](https://github.com/sanity-io/document-internationalization/commit/578a9a023129f4be91250b0dcd443afe3492dd0a))
- manage without translations ([#192](https://github.com/sanity-io/document-internationalization/issues/192)) ([bf301c5](https://github.com/sanity-io/document-internationalization/commit/bf301c5a2d1a97a0b7ca23728744b27583151ed4))

## [3.0.1](https://github.com/sanity-io/document-internationalization/compare/v3.0.0...v3.0.1) (2024-08-23)

### Bug Fixes

- disable LanguageOption button double-clicks ([#190](https://github.com/sanity-io/document-internationalization/issues/190)) ([3fdaff6](https://github.com/sanity-io/document-internationalization/commit/3fdaff64af1df2879e7bf85f00ef895462359549))

## [3.0.0](https://github.com/sanity-io/document-internationalization/compare/v2.1.2...v3.0.0) (2024-04-09)

### ⚠ BREAKING CHANGES

- add strict ESM support

### Features

- add strict ESM support ([f8ed232](https://github.com/sanity-io/document-internationalization/commit/f8ed23271e401ddf6079ff6090ff1e34165c5ff8))

## [2.1.2](https://github.com/sanity-io/document-internationalization/compare/v2.1.1...v2.1.2) (2024-04-09)

### Bug Fixes

- add provenance ([e31635f](https://github.com/sanity-io/document-internationalization/commit/e31635fa09f9a7dda3141f6debb225fa4ba6b226))

## [2.1.1](https://github.com/sanity-io/document-internationalization/compare/v2.1.0...v2.1.1) (2024-04-04)

### Bug Fixes

- reinit languages on workspace switch ([d1102cb](https://github.com/sanity-io/document-internationalization/commit/d1102cb1f04565fadfac98816d24bb2d571b3f4b))

## [2.1.0](https://github.com/sanity-io/document-internationalization/compare/v2.0.3...v2.1.0) (2024-02-26)

### Features

- exclude fields from duplication ([1cd96dc](https://github.com/sanity-io/document-internationalization/commit/1cd96dcc03754cf2dc03cee9239a3524b0751c88))

## [2.0.3](https://github.com/sanity-io/document-internationalization/compare/v2.0.2...v2.0.3) (2024-01-19)

### Bug Fixes

- update dependencies ([566fd7d](https://github.com/sanity-io/document-internationalization/commit/566fd7db86c70029b3491d0681e5946f4d262ac7))

## [2.0.2](https://github.com/sanity-io/document-internationalization/compare/v2.0.1...v2.0.2) (2023-11-02)

### Bug Fixes

- **deps:** semver version ([87eb4cc](https://github.com/sanity-io/document-internationalization/commit/87eb4cc9b0180e48fd194e5cb34be1fbe9f1d8a9))
- Fixes [#139](https://github.com/sanity-io/document-internationalization/issues/139) - desk tool crash ([82d23c9](https://github.com/sanity-io/document-internationalization/commit/82d23c9982133827f776f6bed6ad03569b218328))
- force new release ([f144bef](https://github.com/sanity-io/document-internationalization/commit/f144bef912f12e1e4df18496b8b3d6abb3b55b52))
- update pkg-utils and exports ([1d50d20](https://github.com/sanity-io/document-internationalization/commit/1d50d208f1175a68381d54655a68ad7b0ac2d718))

## [2.0.1](https://github.com/sanity-io/document-internationalization/compare/v2.0.0...v2.0.1) (2023-06-12)

### Bug Fixes

- reduce listener calls with updated useListeningQuery ([0d81952](https://github.com/sanity-io/document-internationalization/commit/0d8195297b7ac14a13d2c8d36f8af34731505206))

## [2.0.0](https://github.com/sanity-io/document-internationalization/compare/v1.1.1...v2.0.0) (2023-06-01)

### ⚠ BREAKING CHANGES

- New major version
- API has changed, consult README for details
- First prerelease of new document internationalization plugin
- First prerelease of new document internationalization plugin
- First prerelease of new document internationalization plugin

### Features

- add new documentation about templates ([47da9a7](https://github.com/sanity-io/document-internationalization/commit/47da9a703c2d11b49cae29018c862a746211aa73))
- add plugin kit, scaffold bulk publish ([fdda5be](https://github.com/sanity-io/document-internationalization/commit/fdda5be9b9b8f5f65429839811454a9b1f8190f5))
- add search filter for more than 4 languages ([42e0705](https://github.com/sanity-io/document-internationalization/commit/42e070583616f38c637560a86cbef24bf0c2ce44))
- add weakReferences config option ([deef693](https://github.com/sanity-io/document-internationalization/commit/deef693510dbf74bc13ecdc56e7fdc847e244207))
- auto-strengthen published references ([b8c752f](https://github.com/sanity-io/document-internationalization/commit/b8c752f5e6b15191887160b99b765b7643cb39f7))
- better formatting for text warnings ([cdebc30](https://github.com/sanity-io/document-internationalization/commit/cdebc3085f2b30ad20ce088d5b81b6e2b7ec6cc5))
- delete all translations document action ([f8ca5d3](https://github.com/sanity-io/document-internationalization/commit/f8ca5d387992126c807c81ad0249b75113b77a3f))
- export components and context ([ae0f4ff](https://github.com/sanity-io/document-internationalization/commit/ae0f4ff8cbe0be9c9f7f6336a0577c6aaa298f34))
- export DeleteTranslationAction ([a53f8e5](https://github.com/sanity-io/document-internationalization/commit/a53f8e5ad530f24831a103353532520e1f8d0742))
- initial rewrite of plugin ([f302151](https://github.com/sanity-io/document-internationalization/commit/f302151cba3c6c17f3bec272492b8f55cfc8c32f))
- more explainer text in the plugin and readme ([f3e9ce9](https://github.com/sanity-io/document-internationalization/commit/f3e9ce94aae89dee38e7d2b16ed77d1110b3d7ca))
- New prerelease for rewrite of document internationalization ([3430c64](https://github.com/sanity-io/document-internationalization/commit/3430c649f544ea2d8cda8c6a6b9470aed0f12fd2))
- readme update, metadata fields ([1365109](https://github.com/sanity-io/document-internationalization/commit/136510916dc2ca2bba4f527a130a47ef80ea5b11))
- supported languages now takes a function ([d8bab26](https://github.com/sanity-io/document-internationalization/commit/d8bab26ab4d44a6d868b1af0dece0034c48c30bf))
- updated bulk publishing UI ([082ffd1](https://github.com/sanity-io/document-internationalization/commit/082ffd14762e1d0f2d18cf68a0176f71fffa4b32))
- validate correct language in references ([af91456](https://github.com/sanity-io/document-internationalization/commit/af9145673ae204a956ff593f9ab8c655ef61406b))

### Bug Fixes

- clean up types ([d01adb9](https://github.com/sanity-io/document-internationalization/commit/d01adb9cc76d16b3ee758ace68e1f74319df4e6e))
- improve reliability of creating metadata ([9aa21f9](https://github.com/sanity-io/document-internationalization/commit/9aa21f99fe3e5e4e6c074f3e2728ca276b36a6a8))
- lint and satisfy type ([963b51f](https://github.com/sanity-io/document-internationalization/commit/963b51f251efeb2e8403caf7cbbebad978c69ac6))
- modify how patches are written so they do not block one another ([41c83e7](https://github.com/sanity-io/document-internationalization/commit/41c83e7869b7be3762c495652af6a9140a6dab35))
- padding in dropdown and extra tooltip ([8e6d515](https://github.com/sanity-io/document-internationalization/commit/8e6d515d837bb98366f9f0a97cbeb3007710acfa))
- push new release ([b21f066](https://github.com/sanity-io/document-internationalization/commit/b21f06677296f6aa88ee53a5d10d865214eec802))
- query return type ([8d92a1a](https://github.com/sanity-io/document-internationalization/commit/8d92a1a7f255e73cc7a9d09fc56dd80d1fd2eb50))
- re-install plugin utils ([0a6f74e](https://github.com/sanity-io/document-internationalization/commit/0a6f74e9833e59310250ef53c5d7175d12fefdb8))
- reference filter ([ef940ea](https://github.com/sanity-io/document-internationalization/commit/ef940eaab0acdef0d94cd4bb4ff0b4269852fe34))
- reference filter ([4529828](https://github.com/sanity-io/document-internationalization/commit/45298280ae805f459a425da11d2b96093e7cf4cc))
- remove --dry-run flag ([de4666d](https://github.com/sanity-io/document-internationalization/commit/de4666db675d8a19b1d377b8dc3bff3cb2663d0c))
- remove 'lesson' text from templates ([e7718ed](https://github.com/sanity-io/document-internationalization/commit/e7718eda6e584b36805f4cfbd42e03b3455e2946))
- restore updated changelog ([192cdc8](https://github.com/sanity-io/document-internationalization/commit/192cdc8fc1a9e83e0ef37ad38b99ba58dcf6740c))
- scroll translations menu when it overflows ([4b451a3](https://github.com/sanity-io/document-internationalization/commit/4b451a3cad41dc906088bf4e910676b98c0a0822))
- type import ([03af0d1](https://github.com/sanity-io/document-internationalization/commit/03af0d12dc6e8a20ff265f1e10b02aa90f27a1ca))
- type import ([17229a7](https://github.com/sanity-io/document-internationalization/commit/17229a7781a05a73f9621e2bf5b887be0cad3b1a))
- ui consistency ([c54deff](https://github.com/sanity-io/document-internationalization/commit/c54deffd7f2d95b0c347bdfddd8cdc444b3aff04))
- update config files from semantic-release preset ([4ee7b5c](https://github.com/sanity-io/document-internationalization/commit/4ee7b5c22043bc09785828936effff944adcc52c))
- update dependencies ([e977f4a](https://github.com/sanity-io/document-internationalization/commit/e977f4ad4bbe17dc2ff43390146afbf401bea7de))
- update dependencies to solve ELSPROBLEMS ([19bd956](https://github.com/sanity-io/document-internationalization/commit/19bd956edb6098c944e23f91b98c62024735b196))
- update intl array version ([ce425fc](https://github.com/sanity-io/document-internationalization/commit/ce425fc84dbe4224870878b57754ad8d26ca7824))
- update type ([f3a382b](https://github.com/sanity-io/document-internationalization/commit/f3a382ba1f1afac94490b73d78e2b5e4fbe28f7d))
- utils import ([9412544](https://github.com/sanity-io/document-internationalization/commit/9412544a2f78857a2e3bc15bfd86a69bd793e588))

- prepare release ([0c58f6f](https://github.com/sanity-io/document-internationalization/commit/0c58f6fe3b75d56bac2842590a50684e4360afca))
- featNew prerelease for rewrite of document internationalization ([83eced7](https://github.com/sanity-io/document-internationalization/commit/83eced7939de447c16dad1866a293ea225faa9af))
- featNew prerelease for rewrite of document internationalization ([50ad742](https://github.com/sanity-io/document-internationalization/commit/50ad742c0f1f4aee75a174031ad40f2e85648a76))

## [2.0.0-studio-v3-plugin-v2.14](https://github.com/sanity-io/document-internationalization/compare/v2.0.0-studio-v3-plugin-v2.13...v2.0.0-studio-v3-plugin-v2.14) (2023-05-26)

### Bug Fixes

- padding in dropdown and extra tooltip ([8e6d515](https://github.com/sanity-io/document-internationalization/commit/8e6d515d837bb98366f9f0a97cbeb3007710acfa))

## [2.0.0-studio-v3-plugin-v2.13](https://github.com/sanity-io/document-internationalization/compare/v2.0.0-studio-v3-plugin-v2.12...v2.0.0-studio-v3-plugin-v2.13) (2023-05-23)

### Features

- add weakReferences config option ([deef693](https://github.com/sanity-io/document-internationalization/commit/deef693510dbf74bc13ecdc56e7fdc847e244207))

## [2.0.0-studio-v3-plugin-v2.12](https://github.com/sanity-io/document-internationalization/compare/v2.0.0-studio-v3-plugin-v2.11...v2.0.0-studio-v3-plugin-v2.12) (2023-05-15)

### Features

- export components and context ([ae0f4ff](https://github.com/sanity-io/document-internationalization/commit/ae0f4ff8cbe0be9c9f7f6336a0577c6aaa298f34))

### Bug Fixes

- query return type ([8d92a1a](https://github.com/sanity-io/document-internationalization/commit/8d92a1a7f255e73cc7a9d09fc56dd80d1fd2eb50))
- re-install plugin utils ([0a6f74e](https://github.com/sanity-io/document-internationalization/commit/0a6f74e9833e59310250ef53c5d7175d12fefdb8))
- update type ([f3a382b](https://github.com/sanity-io/document-internationalization/commit/f3a382ba1f1afac94490b73d78e2b5e4fbe28f7d))

## [2.0.0-studio-v3-plugin-v2.11](https://github.com/sanity-io/document-internationalization/compare/v2.0.0-studio-v3-plugin-v2.10...v2.0.0-studio-v3-plugin-v2.11) (2023-05-10)

### Features

- delete all translations document action ([f8ca5d3](https://github.com/sanity-io/document-internationalization/commit/f8ca5d387992126c807c81ad0249b75113b77a3f))
- export DeleteTranslationAction ([a53f8e5](https://github.com/sanity-io/document-internationalization/commit/a53f8e5ad530f24831a103353532520e1f8d0742))

## [2.0.0-studio-v3-plugin-v2.10](https://github.com/sanity-io/document-internationalization/compare/v2.0.0-studio-v3-plugin-v2.9...v2.0.0-studio-v3-plugin-v2.10) (2023-04-25)

### Features

- add search filter for more than 4 languages ([42e0705](https://github.com/sanity-io/document-internationalization/commit/42e070583616f38c637560a86cbef24bf0c2ce44))
- better formatting for text warnings ([cdebc30](https://github.com/sanity-io/document-internationalization/commit/cdebc3085f2b30ad20ce088d5b81b6e2b7ec6cc5))

### Bug Fixes

- improve reliability of creating metadata ([9aa21f9](https://github.com/sanity-io/document-internationalization/commit/9aa21f99fe3e5e4e6c074f3e2728ca276b36a6a8))
- modify how patches are written so they do not block one another ([41c83e7](https://github.com/sanity-io/document-internationalization/commit/41c83e7869b7be3762c495652af6a9140a6dab35))
- utils import ([9412544](https://github.com/sanity-io/document-internationalization/commit/9412544a2f78857a2e3bc15bfd86a69bd793e588))

## [2.0.0-studio-v3-plugin-v2.9](https://github.com/sanity-io/document-internationalization/compare/v2.0.0-studio-v3-plugin-v2.8...v2.0.0-studio-v3-plugin-v2.9) (2023-04-14)

### Features

- more explainer text in the plugin and readme ([f3e9ce9](https://github.com/sanity-io/document-internationalization/commit/f3e9ce94aae89dee38e7d2b16ed77d1110b3d7ca))
- readme update, metadata fields ([1365109](https://github.com/sanity-io/document-internationalization/commit/136510916dc2ca2bba4f527a130a47ef80ea5b11))

## [2.0.0-studio-v3-plugin-v2.8](https://github.com/sanity-io/document-internationalization/compare/v2.0.0-studio-v3-plugin-v2.7...v2.0.0-studio-v3-plugin-v2.8) (2023-04-13)

### Features

- auto-strengthen published references ([b8c752f](https://github.com/sanity-io/document-internationalization/commit/b8c752f5e6b15191887160b99b765b7643cb39f7))
- updated bulk publishing UI ([082ffd1](https://github.com/sanity-io/document-internationalization/commit/082ffd14762e1d0f2d18cf68a0176f71fffa4b32))
- validate correct language in references ([af91456](https://github.com/sanity-io/document-internationalization/commit/af9145673ae204a956ff593f9ab8c655ef61406b))

### Bug Fixes

- clean up types ([d01adb9](https://github.com/sanity-io/document-internationalization/commit/d01adb9cc76d16b3ee758ace68e1f74319df4e6e))
- type import ([03af0d1](https://github.com/sanity-io/document-internationalization/commit/03af0d12dc6e8a20ff265f1e10b02aa90f27a1ca))
- type import ([17229a7](https://github.com/sanity-io/document-internationalization/commit/17229a7781a05a73f9621e2bf5b887be0cad3b1a))
- ui consistency ([c54deff](https://github.com/sanity-io/document-internationalization/commit/c54deffd7f2d95b0c347bdfddd8cdc444b3aff04))

## [2.0.0-studio-v3-plugin-v2.7](https://github.com/sanity-io/document-internationalization/compare/v2.0.0-studio-v3-plugin-v2.6...v2.0.0-studio-v3-plugin-v2.7) (2023-04-13)

### Bug Fixes

- update dependencies ([e977f4a](https://github.com/sanity-io/document-internationalization/commit/e977f4ad4bbe17dc2ff43390146afbf401bea7de))

## [2.0.0-studio-v3-plugin-v2.6](https://github.com/sanity-io/document-internationalization/compare/v2.0.0-studio-v3-plugin-v2.5...v2.0.0-studio-v3-plugin-v2.6) (2023-04-12)

### Bug Fixes

- lint and satisfy type ([963b51f](https://github.com/sanity-io/document-internationalization/commit/963b51f251efeb2e8403caf7cbbebad978c69ac6))
- restore updated changelog ([192cdc8](https://github.com/sanity-io/document-internationalization/commit/192cdc8fc1a9e83e0ef37ad38b99ba58dcf6740c))
- update config files from semantic-release preset ([4ee7b5c](https://github.com/sanity-io/document-internationalization/commit/4ee7b5c22043bc09785828936effff944adcc52c))
- update dependencies to solve ELSPROBLEMS ([19bd956](https://github.com/sanity-io/document-internationalization/commit/19bd956edb6098c944e23f91b98c62024735b196))

## [2.0.0-studio-v3-plugin-v2.5](https://github.com/sanity-io/document-internationalization/compare/v2.0.0-studio-v3-plugin-v2.4...v2.0.0-studio-v3-plugin-v2.5) (2022-12-19)

### Bug Fixes

- scroll translations menu when it overflows ([4b451a3](https://github.com/sanity-io/document-internationalization/commit/4b451a3cad41dc906088bf4e910676b98c0a0822))

## [2.0.0-studio-v3-plugin-v2.4](https://github.com/sanity-io/document-internationalization/compare/v2.0.0-studio-v3-plugin-v2.3...v2.0.0-studio-v3-plugin-v2.4) (2022-12-13)

### Features

- supported languages now takes a function ([d8bab26](https://github.com/sanity-io/document-internationalization/commit/d8bab26ab4d44a6d868b1af0dece0034c48c30bf))

### Bug Fixes

- remove 'lesson' text from templates ([e7718ed](https://github.com/sanity-io/document-internationalization/commit/e7718eda6e584b36805f4cfbd42e03b3455e2946))

## [2.0.0-studio-v3-plugin-v2.3](https://github.com/sanity-io/document-internationalization/compare/v2.0.0-studio-v3-plugin-v2.2...v2.0.0-studio-v3-plugin-v2.3) (2022-11-29)

### Bug Fixes

- push new release ([b21f066](https://github.com/sanity-io/document-internationalization/commit/b21f06677296f6aa88ee53a5d10d865214eec802))

## [2.0.0-studio-v3-plugin-v2.2](https://github.com/sanity-io/document-internationalization/compare/v2.0.0-studio-v3-plugin-v2.1...v2.0.0-studio-v3-plugin-v2.2) (2022-11-25)

### Bug Fixes

- reference filter ([ef940ea](https://github.com/sanity-io/document-internationalization/commit/ef940eaab0acdef0d94cd4bb4ff0b4269852fe34))
- reference filter ([4529828](https://github.com/sanity-io/document-internationalization/commit/45298280ae805f459a425da11d2b96093e7cf4cc))
- update intl array version ([ce425fc](https://github.com/sanity-io/document-internationalization/commit/ce425fc84dbe4224870878b57754ad8d26ca7824))

## [2.0.0-studio-v3-plugin-v2.1](https://github.com/sanity-io/document-internationalization/compare/v1.0.1...v2.0.0-studio-v3-plugin-v2.1) (2022-11-22)

### ⚠ BREAKING CHANGES

- API has changed, consult README for details
- First prerelease of new document internationalization plugin
- First prerelease of new document internationalization plugin
- First prerelease of new document internationalization plugin

### Features

- add plugin kit, scaffold bulk publish ([fdda5be](https://github.com/sanity-io/document-internationalization/commit/fdda5be9b9b8f5f65429839811454a9b1f8190f5))
- initial rewrite of plugin ([f302151](https://github.com/sanity-io/document-internationalization/commit/f302151cba3c6c17f3bec272492b8f55cfc8c32f))
- New prerelease for rewrite of document internationalization ([3430c64](https://github.com/sanity-io/document-internationalization/commit/3430c649f544ea2d8cda8c6a6b9470aed0f12fd2))

### Bug Fixes

- remove --dry-run flag ([de4666d](https://github.com/sanity-io/document-internationalization/commit/de4666db675d8a19b1d377b8dc3bff3cb2663d0c))

- featNew prerelease for rewrite of document internationalization ([83eced7](https://github.com/sanity-io/document-internationalization/commit/83eced7939de447c16dad1866a293ea225faa9af))
- featNew prerelease for rewrite of document internationalization ([50ad742](https://github.com/sanity-io/document-internationalization/commit/50ad742c0f1f4aee75a174031ad40f2e85648a76))
