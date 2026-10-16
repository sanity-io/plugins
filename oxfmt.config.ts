import pluginKitOxfmt from '@sanity/plugin-kit/oxfmt'
import {defineConfig} from 'oxfmt'

// Shared Sanity plugin formatting settings live in the @sanity/plugin-kit preset;
// only workspace-specific ignore patterns belong here.
export default defineConfig({
  ...pluginKitOxfmt,
  ignorePatterns: [
    ...(pluginKitOxfmt.ignorePatterns ?? []),
    'storybook-static/**',
    'CHANGELOG.md',
    'turbo/**/*.hbs',
    // The CSS module typings css-modules-kit writes (`pnpm css:types`); `pnpm lint` checks them
    // against the generator's output byte for byte
    '**/generated/**/*.module.css.d.ts',
  ],
})
