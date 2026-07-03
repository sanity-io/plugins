import {defineConfig} from '@sanity/tsdown-config'
import type {UserConfig} from 'tsdown'

const config: UserConfig = {
  ...(await defineConfig({
    platform: 'node',
    dts: {tsgo: true},
  })),
  // `platform: 'node'` defaults to `.mjs`/`.d.mts` output; keep the published `.js`/`.d.ts`
  // layout that `bin/plugin-kit.js` and `types` already point at
  fixedExtension: false,
}

export default config
