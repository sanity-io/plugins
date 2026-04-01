# @sanity/sfcc

Sanity plugin for Salesforce Commerce Cloud (SFCC) integration.

Provides schema building blocks, desk structure, document actions, and UI components for managing SFCC-synced product and category data with editorial enrichment in Sanity Studio.

## Installation

```bash
npm install @sanity/sfcc
```

## Usage

```ts
import {sfccPlugin} from '@sanity/sfcc'
import {defineConfig} from 'sanity'

export default defineConfig({
  // ...
  plugins: [sfccPlugin()],
})
```

See the [plugin documentation](https://github.com/sanity-io/plugins/tree/main/plugins/@sanity/sfcc) for full setup instructions.

## License

MIT
