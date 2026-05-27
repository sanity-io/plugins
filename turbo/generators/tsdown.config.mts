import {defineConfig} from 'tsdown'

export default defineConfig({
  entry: './src/config.ts',
  format: ['cjs'],
  dts: true,
  deps: {neverBundle: ['@turbo/gen']},
})
