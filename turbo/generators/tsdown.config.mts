import {defineConfig} from 'tsdown'

export default defineConfig({
  entry: './src/config.ts',
  dts: true,
  deps: {neverBundle: ['@turbo/gen']},
})
