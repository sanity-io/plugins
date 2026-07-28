# @sanity/presets

## 1.0.6

### Patch Changes

- [#1697](https://github.com/sanity-io/plugins/pull/1697) [`d82235e`](https://github.com/sanity-io/plugins/commit/d82235ee29efbdffa8bffa2a76c147ccbb4e30e6) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - Remove an unused internal type re-export to satisfy knip checks.

## 1.0.5

### Patch Changes

- [#1622](https://github.com/sanity-io/plugins/pull/1622) [`6fe3c11`](https://github.com/sanity-io/plugins/commit/6fe3c11e32b8187a19fbdc333e4a8b159fe5a616) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.9

## 1.0.4

### Patch Changes

- [#1596](https://github.com/sanity-io/plugins/pull/1596) [`f06fd76`](https://github.com/sanity-io/plugins/commit/f06fd767531740a09a5755f41fa1d3d42da202ae) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.8

## 1.0.3

### Patch Changes

- [#1571](https://github.com/sanity-io/plugins/pull/1571) [`52975b2`](https://github.com/sanity-io/plugins/commit/52975b2f0d4ea5086c800b2ce16190b862284a95) Thanks [@stipsan](https://github.com/stipsan)! - fix(deps): update tsdown to ^0.22.7 and @sanity/tsdown-config to ^0.14.0

## 1.0.2

### Patch Changes

- [#1519](https://github.com/sanity-io/plugins/pull/1519) [`a11d511`](https://github.com/sanity-io/plugins/commit/a11d511b371b332adc08197711583951eb294166) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): update dependency tsdown to ^0.22.5

## 1.0.1

### Patch Changes

- [#1491](https://github.com/sanity-io/plugins/pull/1491) [`2361892`](https://github.com/sanity-io/plugins/commit/236189294b6408c9bced43765e53cf26a11a0e66) Thanks [@stipsan](https://github.com/stipsan)! - Build with `tsdown` instead of `@sanity/pkg-utils`. Internal build-tooling change only, with no intended changes to the public API or runtime behavior.

## 1.0.0

### Major Changes

- [#1390](https://github.com/sanity-io/plugins/pull/1390) [`747c44e`](https://github.com/sanity-io/plugins/commit/747c44ea2b75ed57f2b0c0c80139bc300621f0e7) Thanks [@jordanl17](https://github.com/jordanl17)! - Rework the README around the recommended registry-based setup: add a from-scratch getting-started walkthrough, document where to create the registry to avoid import cycles, explain inline vs named type usage, and correct the documented Image and SEO field behaviour

## 0.5.2

### Patch Changes

- [#1304](https://github.com/sanity-io/plugins/pull/1304) [`5d2195a`](https://github.com/sanity-io/plugins/commit/5d2195a8b56b1907391a6bfb9cff9ca5448bc9dc) Thanks [@squiggler-app](https://github.com/apps/squiggler-app)! - fix(deps): Update dependency @sanity/uuid to ^3.0.3

## 0.5.1

### Patch Changes

- [#980](https://github.com/sanity-io/plugins/pull/980) [`98d148e`](https://github.com/sanity-io/plugins/commit/98d148e00ef679b422e1effe7fc53dfce9cb046c) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Update `@sanity/pkg-utils` to pick up a DTS generation bug fix.

## 0.5.0

### Minor Changes

- [#917](https://github.com/sanity-io/plugins/pull/917) [`d370188`](https://github.com/sanity-io/plugins/commit/d3701886b1c582f85a5e5c3bfde82356bbb50dc3) Thanks [@jordanl17](https://github.com/jordanl17)! - `defineImage` now returns a native Sanity `image` type instead of an `object` wrapper. `altText` and `caption` are added via the image type's `fields` array; `hotspot` is controlled via the top-level `options`.

  **Migration note - data path changes**

  If you have content saved with an earlier pre-release of this package, the asset, hotspot, and crop paths have moved:

  | Property | Before                  | After             |
  | -------- | ----------------------- | ----------------- |
  | Asset    | `<field>.image.asset`   | `<field>.asset`   |
  | Hotspot  | `<field>.image.hotspot` | `<field>.hotspot` |
  | Crop     | `<field>.image.crop`    | `<field>.crop`    |

  `altText` and `caption` remain at `<field>.altText` and `<field>.caption` - their paths are unchanged.

  **Schema type change**

  The `map` hook for `defineImage` now targets `ImageDefinition` keys (e.g. `fields`, `options`) rather than `ObjectDefinition` keys.

- [#919](https://github.com/sanity-io/plugins/pull/919) [`a8d0e57`](https://github.com/sanity-io/plugins/commit/a8d0e57540e4750cce154e87a14fe28dd68e5fd8) Thanks [@jordanl17](https://github.com/jordanl17)! - Rename `link.internalTypes` to `link.to`, aligning with the Schema API's `reference.to`. The `to` option now accepts both string shorthand (`['page', 'post']`) and the object form (`[{type: 'page'}]`) used natively by `reference.to`.

### Patch Changes

- [#915](https://github.com/sanity-io/plugins/pull/915) [`d08dcf5`](https://github.com/sanity-io/plugins/commit/d08dcf52585ed2185c3256a437dead20f2c65754) Thanks [@jordanl17](https://github.com/jordanl17)! - Add author-facing descriptions to preset fields to improve in-Studio guidance

- [#918](https://github.com/sanity-io/plugins/pull/918) [`1616c4a`](https://github.com/sanity-io/plugins/commit/1616c4aaef367fd62a77833bef0647fc11bb7227) Thanks [@jordanl17](https://github.com/jordanl17)! - Demote OG image dimension validation from error to warning so non-1200×630 images (e.g. square product images for JSON-LD) no longer block document publishing

- [#914](https://github.com/sanity-io/plugins/pull/914) [`f507d65`](https://github.com/sanity-io/plugins/commit/f507d656227a90f04ececa9938ff3941f2cc0532) Thanks [@jordanl17](https://github.com/jordanl17)! - Tighten `RegistryContext.getPreset` return type to `SchemaTypeDefinition & FieldDefinition` to reflect what the registry actually returns

## 0.4.2

### Patch Changes

- [#903](https://github.com/sanity-io/plugins/pull/903) [`2f03c8d`](https://github.com/sanity-io/plugins/commit/2f03c8d98039c29b9d4fd9bc6cd7c09c909c8cc4) Thanks [@bjoerge](https://github.com/bjoerge)! - Widen `sanity` peer-dependency range to `^5 || ^6.0.0-0` to support Sanity Studio v6 (including v6 pre-releases).

## 0.4.1

### Patch Changes

- [#874](https://github.com/sanity-io/plugins/pull/874) [`91a7140`](https://github.com/sanity-io/plugins/commit/91a7140b4bfd80cc04a45eba41b7a8e4cd01ffaf) Thanks [@jordanl17](https://github.com/jordanl17)! - `definePage` now accepts rich text presets in `pageBuilderBlocks`, both inline (`defineRichText({...})`) and by name (`'richText'`). Documents store each rich text block as `{_type, content: [...]}`.

- [#873](https://github.com/sanity-io/plugins/pull/873) [`8c00079`](https://github.com/sanity-io/plugins/commit/8c00079781ee21b5fd67751f8d18856ed3107c9f) Thanks [@juice49](https://github.com/juice49)! - Preset schema type titles are now correctly inferred based on the user-provided `name`.

## 0.4.0

### Minor Changes

- [#859](https://github.com/sanity-io/plugins/pull/859) [`d9a9f21`](https://github.com/sanity-io/plugins/commit/d9a9f21af2b20dd55a3772ab10a3a6d439853319) Thanks [@jordanl17](https://github.com/jordanl17)! - `name` is now required on every `define<Type>` factory (`defineLink`, `defineCta`, `defineSeo`, `defineImage`, `definePage`, `defineRichText`). Calls without a name fail at the type level and throw at runtime.

  `definePage`'s `pageBuilderBlocks` now accepts inline preset instances alongside string type-name references, so you can mix both: `pageBuilderBlocks: ['hero', defineImage({name: 'imageBlock'})]`.

## 0.3.0

### Minor Changes

- [#788](https://github.com/sanity-io/plugins/pull/788) [`cff0c6d`](https://github.com/sanity-io/plugins/commit/cff0c6d24a0de9c709ab3087ccec4853497f4a4a) Thanks [@juice49](https://github.com/juice49)! - Presets now provide methods for extending and overriding the created schema type.

- [#828](https://github.com/sanity-io/plugins/pull/828) [`6de1330`](https://github.com/sanity-io/plugins/commit/6de13306c0b3916154299fdbbdae70c440d232a8) Thanks [@juice49](https://github.com/juice49)! - Replace plugin-based API with a registry-based API. `createPresetsRegistry()` is the new entry point — it returns `define<Type>` functions that produce schema types directly, added to `schema.types` instead of `plugins`.

  Key changes:

  - **Registry-level configuration.** Configure `link.internalTypes` once and it cascades to every preset that composes a link (CTA, rich text).
  - **User-defined type names.** All `name` values are provided at the call site.
  - **Inline composition.** Composed presets (e.g. the link inside a CTA) are inlined as anonymous object fields via `registry.getPreset()`, replacing the previous `composes` mechanism.
  - **Map hooks.** Every preset accepts a `map` option for full control over the produced schema type.

- [#844](https://github.com/sanity-io/plugins/pull/844) [`80b0a6f`](https://github.com/sanity-io/plugins/commit/80b0a6f115168438103e90b4c23fa7dbfd5d00b9) Thanks [@jordanl17](https://github.com/jordanl17)! - Add `defineRichText` for Portable Text fields with composable link annotations, image blocks, and inline CTA objects. Embedded objects are on by default and can be disabled via `objects: false` or toggled individually (e.g. `objects: {cta: false}`). Embedded presets inherit registry-level configuration.

- [#856](https://github.com/sanity-io/plugins/pull/856) [`4f80525`](https://github.com/sanity-io/plugins/commit/4f8052541aaff67d4902749b2e4220e47315d99b) Thanks [@juice49](https://github.com/juice49)! - Initial release.

  This is the first `@sanity/presets` release, and should be considered
  experimental as we work towards version 1. We aim to keep the API
  stable, but may make adjustments to address feedback.

  The following presets are available:

  - page
  - link
  - cta
  - seo
  - image
  - richText

  Since the last changelog entry:

  - The API is now based on inline type factories, rather than composing
    global types based on their name.
  - `defineRichText` has been added to create Portable Text fields that
    include link, CTA, and image objects based on global configuration.

- [#789](https://github.com/sanity-io/plugins/pull/789) [`a4094da`](https://github.com/sanity-io/plugins/commit/a4094da9cb5b84862df8dc81a128ca21bca4b277) Thanks [@juice49](https://github.com/juice49)! - The presets plugin now logs a telemetry event when a workspace is rendered, if that workspace has presets installed. The event includes a list of the installed preset names.

## 0.2.0

### Minor Changes

- [#783](https://github.com/sanity-io/plugins/pull/783) [`aa6b2a2`](https://github.com/sanity-io/plugins/commit/aa6b2a221984fa1f9b3ee487c21b013b63f5f02a) Thanks [@juice49](https://github.com/juice49)! - - Presets factories are now created using the definePresetType function.
  - Presets can specify a composes array; these types will automatically be included if the user has not included them themselves.
  - Added `ctaType`, `seoType`, and `pageType`.

## 0.1.0

### Minor Changes

- [#727](https://github.com/sanity-io/plugins/pull/727) [`14412b2`](https://github.com/sanity-io/plugins/commit/14412b22b8da4aca3a14285367ee7bd397c1c975) Thanks [@jordanl17](https://github.com/jordanl17)! - Add link field preset and preset composer plugin

- [#763](https://github.com/sanity-io/plugins/pull/763) [`ba1277e`](https://github.com/sanity-io/plugins/commit/ba1277e91ffecdf1d85e96674aac18dd2cff7b30) Thanks [@juice49](https://github.com/juice49)! - Refactor preset composer and link type APIs:

  ```diff
  -presetsComposer([linkField({internalTypes: ['corePresetsTest']})])
  +presets(linkType({internalTypes: ['corePresetsTest']}))
  ```

## 0.0.2

### Patch Changes

- [#723](https://github.com/sanity-io/plugins/pull/723) [`9cd690b`](https://github.com/sanity-io/plugins/commit/9cd690b82cd91a013b3c772b1da001601be55c36) Thanks [@jordanl17](https://github.com/jordanl17)! - Initial scaffolding for @sanity/presets plugin
