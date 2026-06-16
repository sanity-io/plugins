import {definePlugin} from 'sanity'

import {AsyncList, createAsyncListInput} from './components/async-list'
import {schema} from './schema-types'
import type {AsyncListPluginConfig} from './types'

export {AsyncList, createAsyncListInput}
export type {AsyncListInputProps} from './components/async-list'
export type {AsyncListInputOptions, AsyncListPluginConfig} from './types'

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
