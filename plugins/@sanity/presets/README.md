# @sanity/presets

Production ready preset patterns for Sanity Studio

## Installation

```bash
npm install --save @sanity/presets
```

or

```bash
pnpm add @sanity/presets
```

or

```
yarn add @sanity/presets
```

## Usage

Add it as a plugin in sanity.config.ts:

```js
import {defineConfig} from 'sanity'
import {presets} from '@sanity/presets'

export default defineConfig({
  // ...
  plugins: [presets()],
})
```
