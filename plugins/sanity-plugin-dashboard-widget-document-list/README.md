# sanity-plugin-dashboard-widget-document-list

> For the v2 version, please refer to the [v2-branch](https://github.com/sanity-io/dashboard-widget-document-list/tree/studio-v2).

## What is it?

Dashboard widget for the Sanity Content Studio which displays a list of documents.

## Install

```
npm install --save sanity-plugin-dashboard-widget-document-list
```

or

```
yarn add sanity-plugin-dashboard-widget-document-list
```

Ensure that you have followed install and usage instructions for @sanity/dashboard.

## Usage

Add dashboard-widget-document-list as a widget to @sanity/dashboard plugin in sanity.config.ts (or .js):

```js
import {dashboardTool} from '@sanity/dashboard'
import {documentListWidget} from 'sanity-plugin-dashboard-widget-document-list'

export default defineConfig({
  // ...
  plugins: [
    dashboardTool({
      widgets: [documentListWidget()],
    }),
  ],
})
```

_Note_: If a document in the result (as returned by the backend) has a draft, that draft is rendered instead of the published document.

## Options

There are some options available, as specified by [DocumentListConfig](src/DocumentList.tsx):

### `title` (string)

Widget title

```js
documentListWidget({
  title: 'Some documents',
})
```

### `order` (string)

Field and direction to order by when docs are rendered

```js
documentListWidget({
  title: 'Last edited',
  order: '_updatedAt desc',
})
```

### `limit` (number)

Number of docs rendered

```js
documentListWidget({
  title: 'Last edited',
  order: '_updatedAt desc',
  limit: 3,
})
```

### `types` (array)

Array of strings signifying which document (schema) types are fetched

```js
documentListWidget({
  title: 'Last edited',
  order: '_updatedAt desc',
  types: ['book', 'author'],
})
```

### `query` (string) and `params` (object)

Customized GROQ query with params for maximum control. If you use the query option, the `types`, `order`, and `limit` options will cease to function. You're on your own.

```js
documentListWidget({
  title: 'Published books by title',
  query: '*[_type == "book" && published == true] | order(title asc) [0...10]',
})
```

```js
documentListWidget({
  title: 'My favorite documents',
  query: '*[_id in $ids]',
  params: {
    ids: ['ab2', 'c5z', '654'],
  },
})
```

### `createButtonText` (string)

You can override the button default button text (`Create new ${types[0]}`) by setting `createButtonText` to a string of your choice. This doesn't support dynamic variables.

```js
documentListWidget({
  title: 'Blog posts',
  query: '*[_type == "post"]',
  createButtonText: 'Create new blog post',
})
```

### `showCreateButton` (boolean)

You can disable the create button altogether by passing a `showCreateButton` boolean:

```js
documentListWidget({
  showCreateButton: false,
})
```

### Widget size

You can change the width of the plugin using `layout.width`:

```js
documentListWidget({
  layout: {width: 'small'},
})
```

## License

MIT-licensed. See LICENSE.

## Develop & test

This plugin uses [@sanity/plugin-kit](https://github.com/sanity-io/plugin-kit)
with default configuration for build & watch scripts.

See [Testing a plugin in Sanity Studio](https://github.com/sanity-io/plugin-kit#testing-a-plugin-in-sanity-studio)
on how to run this plugin with hotreload in the studio.

### Release new version

Run ["CI & Release" workflow](https://github.com/sanity-io/dashboard-widget-document-list/actions/workflows/main.yml).
Make sure to select the main branch and check "Release new version".

Semantic release will only release on configured branches, so it is safe to run release on any branch.
