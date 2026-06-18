# Sanity Embeddings Index UI

> ⚠️ **Deprecation Notice**
>
> The Embeddings Index API is deprecated and will be sunset in a future release. We recommend migrating to the new **Embeddings** feature, now natively available within Sanity datasets.
>
> The new Embeddings feature offers a more integrated experience with improved performance and full support going forward. **No new features or fixes will be made to this package.**
>
> If you have questions or need migration support, please [open an issue](https://github.com/sanity-io/plugins/issues) or reach out via [Sanity Community Discord](https://discord.com/servers/sanity-1304483263171264613).
---

Sanity Studio plugins that interact with the `/embeddings-index` HTTP API.

The Embeddings Index API enables the creation, management, and search of named embeddings vector indexes.

> Using this feature requires Sanity to send data to OpenAI.com, and Pinecone.io for storing vector interpretations of documents.

An embeddings index contains embeddings for all Sanity documents matching a configured [GROQ filter](https://www.sanity.io/docs/how-queries-work) in a dataset.
A [GROQ projection](https://www.sanity.io/docs/query-cheat-sheet) is applied to matching documents before vectorization.

You can query indexes using semantic text search to obtain a list of matching document IDs sorted by relevance.

When an index is first created, all documents matching the configured filter are synced into the index.
Creating an index can take time, depending on the number of existing documents and the indexer load.

For a CLI alternative, check out the [Embeddings Index CLI](https://github.com/sanity-io/embeddings-index-cli) package.

## Installation

```sh
npm install @sanity/embeddings-index-ui
```

`@sanity/embeddings-index-ui` contains the following Sanity Studio plugins:

- [embeddingsIndexReferenceInput](#embeddings-index-reference-input): semantic search mode for reference inputs
- [embeddingsIndexDashboard](#embeddings-index-dashboard): manage indexes in a Sanity Studio UI tool

For more information about using the plugins, see the relevant sections below.

## Semantic reference search input

<img width="619" alt="image" src="https://github.com/sanity-io/sanity/assets/835514/55d372fe-c5fe-40dd-882b-10c6e8794442">

The Embeddings Index UI ships with a Semantic reference search input component. This enables you to search for [references](https://www.sanity.io/docs/connected-content) using natural language and to retrieve documents based on semantic meaning rather than exact string matches.

### Usage

You can add the semantic reference search input by importing and adding `embeddingsIndexReferenceInput` as a plugin to `sanity.config.ts` (or `.js`):

```ts
import {defineConfig} from 'sanity'
import {embeddingsIndexReferenceInput} from '@sanity/embeddings-index-ui'

export default defineConfig({
  //...
  plugins: [embeddingsIndexReferenceInput()],
})
```

Then, enable semantic search using `options.embeddingsIndex` on reference fields.
Example of a default configuration for a reference field:

```ts
defineField({
  name: 'myField',
  type: 'reference',
  to: [{type: 'myType'}], // The type(s) of document(s) to include
  options: {
    embeddingsIndex: {
      indexName: 'my-index', // Name of the embeddings index
      maxResults: 10, // Maximum number of returned results per request. Default: 10
      searchMode: 'embeddings', // Sets default search mode for the field. Enables toggling between 'embeddings' (semantic search) and 'default' (default search based on GROQ filter)
    },
  },
})
```

Setting `options.embeddings.indexName` on a reference field enables searching into the named index.

_Note_: the search uses `to` types as a filter for the index. Therefore, the types that the
the reference field expects must exist in the index: the GROQ query specified in the embeddings index
`filter` must include one or more documents that are relevant to the reference field.

_Caveats_: the semantic search functionality does not honor `options.filter`.

### Default embeddings index configuration

You can enable a default configuration for the reference inputs through the plugin configuration.

Example:

```ts
import {defineConfig} from 'sanity'
import {embeddingsIndexReferenceInput} from '@sanity/embeddings-index-ui'

export default defineConfig({
  //...
  plugins: [
    embeddingsIndexReferenceInput({
      indexName: 'my-index', // Inputs use 'my-index' as the default index
      maxResults: 15, // Inputs return max. 15 results per request
      searchMode: 'embeddings', // Semantic search is the default search mode
    }),
  ],
})
```

If you assign a default `indexName` to the plugin, you can also enable embeddings search
by setting `options.embeddingsIndex: true` for a reference field:

```ts
defineField({
  name: 'myField',
  type: 'reference',
  to: [{type: 'myType'}],
  options: {
    embeddingsIndex: true,
  },
})
```

## Embeddings Index API dashboard for Sanity Studio

A UI alternative to the [Embeddings Index CLI](https://github.com/sanity-io/embeddings-index-cli) to
manage embeddings indexes in a Studio dashboard. It also lets you test semantic search on the indexes.

<img width="1227" alt="image" src="https://github.com/sanity-io/sanity/assets/835514/279b03b8-d2c0-4cc1-bbe6-9d335937f25a">

### Usage

Add `embeddingsIndexDashboard` as a plugin to `sanity.config.ts` (or `.js`):

```ts
import {defineConfig} from 'sanity'
import {embeddingsIndexDashboard} from '@sanity/embeddings-index-ui'

export default defineConfig({
  //...
  plugins: [
    process.env.NODE_ENV === 'development'
      ? embeddingsIndexDashboard()
      : {name: 'embeddings-index-dashboard-disabled'},
  ],
})
```

This adds the Embeddings Index API tool to the studio navigation bar, but only when the studio is running in developer mode (`localhost`).

If you want to enable the tool based on user access roles:

```ts
import {defineConfig} from 'sanity'
import {embeddingsIndexDashboard} from '@sanity/embeddings-index-ui'

export default defineConfig({
  //...
  plugins: [embeddingsIndexDashboard()],

  tools: (prev, context) => {
    const enabledForRoles = ['developer']
    const canManageEmbeddingsIndex = context.currentUser?.roles
      .map((role) => role.name)
      .some((roleName) => enabledForRoles.includes(roleName))
    return canManageEmbeddingsIndex ? prev : prev.filter((tool) => tool.name !== 'embeddings-index')
  },
})
```

## License

[MIT](LICENSE) © Sanity
