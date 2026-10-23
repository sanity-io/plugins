import {defineConfig} from 'vitest/config'

export default defineConfig({
  oxc: {
    jsx: {runtime: 'automatic'},
  },
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    passWithNoTests: false,
    // `true` (rather than themer's narrower `{include: [/\.module\.css$/]}`) because this
    // plugin also imports a plain stylesheet (`@sanity/ui/styles.css` in `src/index.ts`).
    // Vitest's stand-in for an unprocessed CSS module is a default export only, so the
    // `import * as styles` and named imports this plugin uses would read `undefined` without
    // this — Vite compiles the modules instead, so they export every class name like the
    // build does.
    css: true,
  },
})
