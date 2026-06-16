# Sanity Table Plugin

This is a (triple) fork of the Sanity Plugin Table, now maintained by Sanity.io.

![example](https://user-images.githubusercontent.com/8467307/48703530-e369be00-ebeb-11e8-8299-14812461aee8.gif)

## Acknowledgements

Big thanks to the original contributors for their work!

- Original version: [rdunk/sanity-plugin-table](https://github.com/rdunk/sanity-plugin-table).
- Further improvements in fork [MathisBullinger/sanity-plugin-another-table](https://github.com/MathisBullinger/sanity-plugin-another-table).
- Initial Studio port: [bitfo/sanity-plugin-table](https://github.com/bitfo/sanity-plugin-table)

## Disclaimer

Sometimes a table is just what you need.
However, before using the Table plugin, consider if there are other ways to model your data that are:

- easier to edit and validate
- easier to query

Approaching your schemas in a more structured manner can often pay dividends down the line.

## Install

Install using npm

```bash
$ npm i --save @sanity/table
```

## Usage

Add the plugin to your project configuration. Then use the type in your schemas

```js
// sanity.config.ts

import {defineConfig} from 'sanity'

import {table} from '@sanity/table'

export default defineConfig({
  name: 'default',
  title: 'My Cool Project',
  projectId: 'my-project-id',
  dataset: 'production',
  plugins: [
    // Include the table plugin
    table(),
  ],
  schema: {
    types: [
      {
        name: 'product',
        title: 'Product',
        type: 'document',
        fields: [
          {
            // Include the table as a field
            // Giving it a semantic title
            name: 'sizeChart',
            title: 'Size Chart',
            type: 'table',
          },
        ],
      },
    ],
  },
})
```

## Configuration

You can optionally configure the `_type` used for the row object in the table schema by passing a `rowType` when adding the plugin. For most users this is unnecessary, but it can be useful if you are migrating from a legacy table plugin.

```js
export default defineConfig({
  // ...
  plugins: [
    table({
      rowType: 'my-custom-row-type',
    }),
  ],
  // ...
})
```

## License

[MIT](LICENSE) © ʞunp ʇɹǝdnɹ, Mathis Bullinger, Dave Lucia and Sanity.io
