# @sanity/presets

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
