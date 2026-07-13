import {defineConfig} from '@sanity/tsdown-config'
import type {UserConfig} from 'tsdown'

const base = await defineConfig({
  entry: ['./src/index.ts', './src/oxfmt.ts'],
  platform: 'node',
  dts: {tsgo: true},
})

const config: UserConfig = {
  ...base,
  // `platform: 'node'` defaults to `.mjs`/`.d.mts` output; keep the published `.js`/`.d.ts`
  // layout that `bin/plugin-kit.js` and `types` already point at
  fixedExtension: false,
  exports: {
    ...(typeof base.exports === 'object' ? base.exports : {}),
    // The shared oxlint config is a static JSON file (not a build entry); add it to the
    // generated exports map so `@sanity/plugin-kit/oxlint` resolves
    customExports(exports) {
      exports['./oxlint'] = './oxlint-config.json'
      return exports
    },
  },
}

export default config
