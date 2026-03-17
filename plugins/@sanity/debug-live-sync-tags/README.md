# @sanity/debug-live-sync-tags

## Installation

```bash
npm install --save @sanity/debug-live-sync-tags
```

or

```bash
pnpm add @sanity/debug-live-sync-tags
```

or

```
yarn add @sanity/debug-live-sync-tags
```

## Usage

Add it as a plugin in sanity.config.ts:

```js
import {defineConfig} from 'sanity'
import {debugLiveSyncTags} from '@sanity/debug-live-sync-tags'

export default defineConfig({
  // ...
  plugins: [debugLiveSyncTags()],
})
```
