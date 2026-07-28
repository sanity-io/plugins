import pluginKitOxfmt from '@sanity/plugin-kit/oxfmt'
import {defineConfig} from 'oxfmt'

// Shared Sanity plugin formatting settings live in the @sanity/plugin-kit preset;
// only workspace-specific ignore patterns belong here.
export default defineConfig({
  ...pluginKitOxfmt,
  ignorePatterns: [...(pluginKitOxfmt.ignorePatterns ?? []), 'turbo/**/*.hbs'],
})
