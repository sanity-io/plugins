# Sanity + Bynder = 🌁

![bynder demo](https://user-images.githubusercontent.com/38528/120554854-1ee5c580-c3af-11eb-9b05-0b35c6810497.gif)

This plugin adds your familiar Bynder user interface in the Sanity Studio, letting you pick any asset you are managing on Bynder and still serve it from Bynder in your frontends.

## Installation

```bash
npm install sanity-plugin-bynder-input
```

## Usage

Add `bynderInputPlugin` to `plugins` in `sanity.config.ts` (or.js) and specify your Bynder portal domain.
You can also specify which language you want the Bynder widget UI to render.

```ts
 import {defineConfig} from 'sanity'
 import {bynderInputPlugin} from 'sanity-plugin-bynder-input'

 export const defineConfig({
    // ... other config
    plugins: [
      bynderInputPlugin(
          {
            portalConfig: {
              // See Bynder Compact View docs for all options
              url: "https://wave-trial.getbynder.com/"
            },
            compactViewOptions: {
              // See Bynder Compact View docs for all options
              language: "en_US"
            }
          }
      )
    ]
 })
```

## Specifying asset types

The default selectable asset types are `image`, `audio`, `video` and `document`.
You can restrict a field to one or more types with the `assetTypes` option in your schema.
If you do not specify options all asset types will be available for selection.

Here is an example of a document that has one Bynder asset field restricted to only images, and another which can be either a video or an audio file.

```javascript
import {defineType, defineField} from 'sanity'

export const myDocumentSchema = defineType({
  type: 'document',
  name: 'article',
  fields: [
    defineField({
      type: 'bynder.asset',
      name: 'image',
      options: {
        assetTypes: ['image'],
      },
    }),
    defineField({
      type: 'bynder.asset',
      name: 'temporalMedia',
      options: {
        assetTypes: ['video', 'audio'],
      },
    }),
  ],
})
```

## Specifying asset filters

If you are looking for a more robust way to filter assets, you can restrict the initial set of assets with the `assetFilter` option.

Here is an example of a document that has one Bynder asset field restricted to only images, and another which can be either a video or an audio file.

```javascript
import {defineType, defineField} from 'sanity'

export const myDocumentSchema = defineType({
  type: 'document',
  name: 'article',
  fields: [
    defineField({
      type: 'bynder.asset',
      name: 'image',
      options: {
        assetTypes: ['image'],
        assetFilter: {
          // Filter by tags
          tagNames_in: ['foo', 'bar'],
          // and show the toolbar to let the user adjust the filters
          showToolbar: true,
          // You can optionally filter the asset types in the initial view like this
          // Note that a user can clear their view and still select the asset type.
          // If you need it fully enforced, use the `assetType` option instead
          //
          // assetType_in: ["IMAGE"],
        },
      },
    }),
  ],
})
```

Here is the full set of options for the `assetFilter`.

```typescript
// See https://www.npmjs.com/package/@bynder/compact-view for latest options
type BynderAssetFilterJson = {
  predefinedAssetType?: ('AUDIO' | 'DOCUMENT' | 'IMAGE' | 'VIDEO' | 'ARCHIVE')[] // predefined asset types
  collectionId?: string // predefined collection id
  predefinedMetapropertiesOptions?: string[] // predefined metaproperty IDs
  searchTerm?: string // predefined search term
  predefinedTagNames?: string[] // predefined tags
  isLimitedUse?: boolean // whether or not this asset is marked as Limited Use
  showToolbar?: boolean // show toolbar for predefined filters (false by default)
}
```

## License

[MIT](LICENSE) © Sanity.io
