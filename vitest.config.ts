import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    // styled-components turns off its fast CSSOM injection path ("speedy"
    // mode) whenever NODE_ENV !== 'production' and appends CSS text nodes to
    // <style> tags instead. jsdom reparses the whole stylesheet on every such
    // insertion, which slows first mounts of styled-heavy trees down enough to
    // trip default testing-library timeouts. Force the production injection
    // path, which is also what the @sanity/styled-components fork always used.
    // See https://github.com/sanity-io/sanity/pull/13675
    env: {SC_DISABLE_SPEEDY: 'false'},
    // All plugins are tested as separate projects
    // Each plugin needs its own vitest.config.ts in its directory
    projects: [
      'packages/@sanity/*',
      'plugins/@sanity/*',
      'plugins/sanity-plugin-*',
      'plugins/sanity-naive-html-serializer',
      'plugins/sanity-translations-tab',
      'scripts/*',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['html', 'json', 'json-summary'],
      reportOnFailure: true,
    },
  },
})
