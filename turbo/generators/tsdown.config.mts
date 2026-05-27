import {defineConfig} from 'tsdown'

// CJS output is required because turbo gen loads config in a CommonJS context.
// ESM output would cause `import.meta.url` to be undefined in the require() context,
// breaking the `createRequire(import.meta.url)` call used internally.
export default defineConfig({
  entry: './src/config.ts',
  format: ['cjs'],
  dts: true,
  deps: {neverBundle: ['@turbo/gen']},
})
