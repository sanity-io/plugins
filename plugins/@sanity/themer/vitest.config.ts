import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    // Building whole themes and comparing every color in them takes several
    // seconds with coverage on, as CI runs pull requests
    testTimeout: 30_000,
    // Vitest's stand-in for an unprocessed CSS module is a default export only, so the
    // `import * as styles` and named imports the tool uses would read `undefined`. Let Vite
    // compile the modules instead; they then export every class name like the build does.
    css: {include: [/\.module\.css$/]},
    server: {
      deps: {
        inline: ['vitest-package-exports'],
      },
    },
  },
})
