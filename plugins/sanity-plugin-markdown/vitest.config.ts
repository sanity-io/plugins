import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    // Vitest's stand-in for an unprocessed CSS module is a default export only, so the
    // `import * as styles` and named imports the input uses would read `undefined`. Let Vite
    // compile the modules instead; they then export every class name like the build does.
    css: {include: [/\.module\.css$/]},
    server: {
      deps: {
        inline: ['vitest-package-exports'],
      },
    },
  },
})
