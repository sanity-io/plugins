# my-plugin

## Installation

```sh
npm install my-plugin
```

## Usage

Add it as a plugin in `sanity.config.ts` (or .js):

```ts
import {myPlugin} from 'my-plugin'
import {defineConfig} from 'sanity'

export default defineConfig({
  // ...
  plugins: [myPlugin({})],
})
```

## License

MIT © Snorre Brekke
See LICENSE
