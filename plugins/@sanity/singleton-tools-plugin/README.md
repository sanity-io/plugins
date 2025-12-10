# @sanity/singleton-tools-plugin

A fork of sanity-plugin-singleton-tools

## Installation

```bash
npm install --save @sanity/singleton-tools-plugin
```

or

```bash
pnpm add @sanity/singleton-tools-plugin
```

or

```
yarn add @sanity/singleton-tools-plugin
```

## Usage

Add it as a plugin in sanity.config.ts:

```js
import { defineConfig } from 'sanity'
import { singletonTools } from '@sanity/singleton-tools-plugin'

export default defineConfig({
  // ...
  plugins: [singletonTools()],
})
```
