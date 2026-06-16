import {definePlugin} from 'sanity'

import {AsyncList} from './components/async-list'
import {schema} from './schema-types'
import type {AsyncListPluginConfig} from './types'

export {AsyncList}
export type {AsyncListPluginConfig}

/**
 * Usage in `sanity.config.ts` (or .js)
 *
 * ```ts
 * import {defineConfig} from 'sanity'
 * import {asyncList} from '@sanity/sanity-plugin-async-list'
 *
 * export default defineConfig({
 *   // ...
 *   plugins: [asyncList()],
 * })
 * ```
 */
export const asyncList = definePlugin<AsyncListPluginConfig>((config) => {
  if (!config.schemaType) {
    throw new Error('schemaType required by async-list plugin')
  }
  return {
    name: 'sanity-plugin-async-list',
    schema: schema(config),
  }
})
