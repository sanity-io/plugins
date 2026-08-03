# @sanity/sfcc

Sanity plugin for Salesforce Commerce Cloud (SFCC) integration. Provides schema building blocks, desk structure, document actions, and UI components for managing SFCC-synced product and category data alongside editorial content in Sanity Studio.

## What it does

Documents in SFCC (products and categories) are synced into Sanity by our SFCC Cartridge. This plugin provides the Studio-side tooling to work with that synced data:

- **Schema fields** (`sfccProductStoreField`, `sfccCategoryStoreField`) -- read-only `store` objects containing all synced SFCC data, including localized fields powered by `sanity-plugin-internationalized-array`.
- **Preview configs** (`sfccProductPreview`, `sfccCategoryPreview`) -- rich document list previews showing product images, variation attributes, and category hierarchy.
- **Structure builders** (`productStructure`, `categoryStructure`) -- desk structure items that group Master/Simple products with their variants and list categories.
- **Document actions** -- replaces the built-in delete action with one that also removes associated product variants in a single transaction, and hides the duplicate action (documents are managed by the sync process).
- **Offline banner** (`sfccRenderMembers`) -- a caution banner displayed at the top of the document form when a product or category is offline in SFCC.

## Prerequisites

This plugin requires [`sanity-plugin-internationalized-array`](https://github.com/sanity-io/plugins/tree/main/plugins/sanity-plugin-internationalized-array) to be installed and configured in your Studio. The SFCC store fields use `internationalizedArrayString` and `internationalizedArrayText` types for localized product and category data.

## Installation

```bash
npm install @sanity/sfcc sanity-plugin-internationalized-array
```

## Setup

### 1. Configure plugins

Add both `sfccPlugin()` and `internationalizedArray()` to your Sanity config. The internationalized array plugin must include at least the `string` and `text` field types and the languages your SFCC instance supports:

```ts
import {sfccPlugin} from '@sanity/sfcc'
import {defineConfig} from 'sanity'
import {internationalizedArray} from 'sanity-plugin-internationalized-array'
import {structureTool} from 'sanity/structure'

export default defineConfig({
  // ...
  plugins: [
    structureTool({structure}), // see step 3
    sfccPlugin(),
    internationalizedArray({
      languages: [
        {id: 'en_US', title: 'English'},
        {id: 'fr', title: 'French'},
      ],
      defaultLanguages: ['en_US'],
      fieldTypes: ['string', 'text'],
    }),
  ],
  schema: {
    types: [productType, categoryType], // see step 2
  },
})
```

### 2. Define document types

Create your `product` and `category` document types using the exported schema building blocks. Add the `sfcc` group, include the store field, attach the preview config, and wire up the offline banner:

```ts
import {PackageIcon} from '@sanity/icons/Package'
import {TagIcon} from '@sanity/icons/Tag'
import {
  sfccCategoryPreview,
  sfccCategoryStoreField,
  sfccProductPreview,
  sfccProductStoreField,
  sfccRenderMembers,
} from '@sanity/sfcc'
import {defineField, defineType} from 'sanity'

const productType = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  icon: TagIcon,
  groups: [
    {name: 'editorial', title: 'Editorial', default: true},
    {name: 'sfcc', title: 'Salesforce'},
  ],
  renderMembers: sfccRenderMembers,
  fields: [
    // Add your own editorial fields here
    defineField({
      name: 'promotionalContent',
      title: 'Promotional Content',
      type: 'array',
      of: [{type: 'block'}],
      group: 'editorial',
    }),
    // Synced SFCC data (read-only)
    sfccProductStoreField,
  ],
  preview: sfccProductPreview,
})

const categoryType = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  icon: PackageIcon,
  groups: [
    {name: 'editorial', title: 'Editorial', default: true},
    {name: 'sfcc', title: 'Salesforce'},
  ],
  renderMembers: sfccRenderMembers,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      group: 'editorial',
    }),
    sfccCategoryStoreField,
  ],
  preview: sfccCategoryPreview,
})
```

### 3. Set up desk structure

Use the exported structure builders to create a custom desk structure with product/category grouping:

```ts
import {categoryStructure, productStructure} from '@sanity/sfcc'
import {type StructureResolver} from 'sanity/structure'

const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Content')
    .items([
      categoryStructure(S, context),
      productStructure(S, context),
      S.divider(),
      ...S.documentTypeListItems().filter((item) => {
        const id = item.getId()
        return id ? !['category', 'product'].includes(id) : false
      }),
    ])
```

## Exports

| Export                   | Type              | Description                                                                          |
| ------------------------ | ----------------- | ------------------------------------------------------------------------------------ |
| `sfccPlugin`             | Plugin            | Registers document action overrides and hides SFCC types from the "Create new" menu. |
| `sfccProductStoreField`  | Field definition  | Read-only `store` object field for the `product` document type.                      |
| `sfccCategoryStoreField` | Field definition  | Read-only `store` object field for the `category` document type.                     |
| `sfccProductPreview`     | Preview config    | `select` + `prepare` for product document list previews.                             |
| `sfccCategoryPreview`    | Preview config    | `select` + `prepare` for category document list previews.                            |
| `productStructure`       | Structure builder | Desk structure list item for products (Master/Simple with nested variants).          |
| `categoryStructure`      | Structure builder | Desk structure list item for categories.                                             |
| `sfccRenderMembers`      | Callback          | `renderMembers` callback that injects an offline/deleted caution banner.             |
| `SfccDocumentStatus`     | Component         | Preview media component showing product/category thumbnail with a deleted overlay.   |
| `SfccOfflineBanner`      | Component         | Caution banner displayed when `store.onlineFlag` or `store.online` is `false`.       |

## How the plugin modifies document behaviour

For documents with `_type` of `product` or `category`:

- The **duplicate** action is removed (documents are created by the SFCC sync process).
- The **delete** action is replaced with a custom version that, for products, also deletes all associated variants (`store.variants[]._ref`) in a single transaction.
- The document types are hidden from the **"Create new document"** menu - as the source of truth for these are the documents created by the SFCC sync.

## License

MIT
