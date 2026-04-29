# Sanity Media

A convenient way to browse, manage and refine your [Sanity](https://www.sanity.io/) assets.

Use it standalone as a browser, or optionally hook it up as a [custom asset source](https://www.sanity.io/docs/custom-asset-sources) and use it to power both image and file selection too.

![Grid view](https://user-images.githubusercontent.com/209129/108927411-21aa7f00-7638-11eb-9cf7-334598ac4103.png)
_Default grid view_

![Asset view](https://user-images.githubusercontent.com/209129/132573482-fa866da9-7ee0-42db-b39f-25a0e48bba9f.png)
_Individual asset view_

## Features

#### Manage and organise your assets

- Support for batch uploads with drag and drop support
- Edit text fields native to Sanity's asset documents, such as `title`, `description`, `altText` and `originalFilename`
- View asset metadata and a limited subset of EXIF data, if present
- Tag your assets individually or in bulk
- Manage tags directly within the plugin
- Get previews for audio and video files
- Easily select and delete multiple assets in bulk

#### Granular search tools

- Refine your search with any combination of search facets such as filtering by tag name, asset usage, file size, orientation, type (and more)
- Use text search for a quick lookup by title, description and alt text

#### Built for large datasets and collaborative editing in mind

- Virtualized grid + tabular views for super speedy browsing, even with thousands of assets and tags
- Utilises Sanity's [real time updates](https://www.sanity.io/docs/realtime-updates) for live changes from other studio members

#### Fits right in with your Sanity studio

- Built with the same [UI components Sanity uses](https://www.sanity.io/ui) under the hood
- Fully responsive and mobile friendly

## Install

In your Sanity project folder:

```sh
npm install --save sanity-plugin-media
```

or

```sh
yarn add sanity-plugin-media
```

## Usage

Add it as a plugin in your `sanity.config.ts` (or .js) file:

```js
import {media} from 'sanity-plugin-media'

export default defineConfig({
  // ...
  plugins: [media()],
})
```

This will enable the Media plugin as both a standalone tool (accessible in your studio menu) and as an additional asset source for your image and file fields.

### Customizing the asset source

You can configure your studio to use this asset source either exclusively, or conditionally enable it based on the type of asset (image or file).

```js
import {media, mediaAssetSource} from 'sanity-plugin-media'

export default defineConfig({
  // ...
  plugins: [media()],
  form: {
    // Don't use this plugin when selecting files only (but allow all other enabled asset sources)
    file: {
      assetSources: (previousAssetSources) => {
        return previousAssetSources.filter((assetSource) => assetSource !== mediaAssetSource)
      },
    },
  },
})
```

### Plugin Config

```ts
// sanity.config.ts
import {media} from 'sanity-plugin-media'
import {CustomDetails} from './MyCustomDetails'

export default defineConfig({
  //...
  plugins: [
    media({
      creditLine: {
        enabled: true,
        // boolean - enables an optional "Credit Line" field in the plugin.
        // Used to store credits e.g. photographer, licence information
        excludeSources: ['unsplash'],
        // string | string[] - when used with 3rd party asset sources, you may
        // wish to prevent users overwriting the creditLine based on the `source.name`
      },
      maximumUploadSize: 10000000,
      // number - maximum file size (in bytes) that can be uploaded through the plugin interface
      directUploads: true,
      // boolean - enable / disable direct uploads through the plugin interface (default true)
      components: {
        details: CustomDetails,
        // Custom component for asset details (see below)
      },
      // Custom components to override default UI (see below)
      locales: [
        // { id: string, title: string, ...extra }[] - enable localization for asset fields.
        {id: 'en', title: 'English'},
        {id: 'it', title: 'Italian'},
        {id: 'es', title: 'Spanish'},
        {id: 'fr', title: 'French'},
        {id: 'de', title: 'German'},
        {id: 'pt', title: 'Portuguese'},
        {id: 'ja', title: 'Japanese'},
        {id: 'zh', title: 'Chinese'},
        {id: 'ru', title: 'Russian'},
        {id: 'ar', title: 'Arabic'},
      ],
    }),
  ],
})
```

### Localization (Optional)

You can enable localization support by passing a `locales` array to the plugin config, following the [Sanity recommended scheme](https://www.sanity.io/docs/studio/localization#k4da239411955).

If omitted, localization features will be disabled and the plugin will work as usual.

### Custom Asset Details Component

Custom React component for the asset details form via the plugin config. This allows you to override or extend the default asset details UI.

```tsx
// Example custom details component
export function CustomDetails(props) {
  return (
    <>
      <h3>Custom header</h3>
      {props.renderDefaultDetails(props)}
    </>
  )
}
```

## Known issues

<details>
<summary>There isn't a way to edit asset fields directly from the desk (without opening the plugin)</summary>

- A future update will provide the ability to 'jump' straight to a selected asset

</details>

<details>
<summary>Drag and drop uploads don't work when <em>selecting</em> with the plugin</summary>

- This is currently due to Sanity studio's file picker component taking precedence over window drag and drop events
- For now, you'll need to manually press the 'upload' button if you want to add images whilst in a selecting context

</details>

<details>
<summary>Downloaded images are not the originally uploaded files</summary>

- Any images downloaded in the plugin are those _already processed_ by Sanity without any [image transformations](https://www.sanity.io/docs/image-urls) applied
- These are not the original uploaded images: they will likely have a smaller file size and will be stripped of any EXIF data

</details>

<details>
<summary>Limitations when using Sanity's GraphQL endpoints</summary>

- Currently, `opt.media.tags` on assets aren't accessible via GraphQL. This is because `opt` is a custom object used by this plugin and not part of Sanity's asset schema.

</details>

## FAQ

#### Asset fields

<details>
<summary>Where are asset fields stored?</summary>

- This plugin reads and writes _directly_ on the asset document itself (`sanity.imageAsset` or `sanity.fileAsset`)
- This is analogous to setting values _globally_ across all instances of these assets
- If you want to set a caption for an image and have that change between different documents, customise the `fields` property in your document schema's file/image field
- If you want to set values you can query in all instances of that asset (alternate text being a good example), consider setting those in the plugin

</details>

<details>
<summary>How can I query asset fields I've set in this plugin?</summary>

```groq
*[_id == 'my-document-id'] {
  image {
    asset->{
      _ref,
      _type,
      altText,
      description,
      "tags": opt.media.tags[]->name.current,
      title
    }
  }
}
```

</details>

#### Tags

<details>
<summary>How and where are asset tags stored?</summary>

- This plugin defines the document type `media.tag`
- All tags are stored as _weak_ references in the namespaced object `opt.media`

</details>

<details>
<summary>How can I hide the <em>Media Tag</em> document type from the desk?</summary>

- Override using Sanity's [structure builder](https://www.sanity.io/docs/structure-builder-typical-use-cases) and omit the `media.tag` document type

</details>

## Contributing

Contributions, issues and feature requests are welcome!

## License

[MIT](LICENSE) © Sanity.io
