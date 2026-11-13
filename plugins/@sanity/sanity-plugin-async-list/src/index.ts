import '@sanity/ui/styles.css'
import {definePlugin, type PluginOptions} from 'sanity'

import {AsyncList, createAsyncListInput} from './components/async-list'
import {schema} from './schema-types'
import type {AsyncListOption, AsyncListPluginConfig} from './types'

export {AsyncList, createAsyncListInput}
export type {AsyncListInputProps} from './components/async-list'
export type {AsyncListInputOptions, AsyncListOption, AsyncListPluginConfig} from './types'

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
export function asyncList<Option extends AsyncListOption = AsyncListOption>(
  config: AsyncListPluginConfig<Option>,
): PluginOptions {
  if (!config.schemaType) {
    throw new Error('schemaType required by async-list plugin')
  }
  // `definePlugin` drops type parameters, so the generic stays on this wrapper
  // and validation still runs against the plugin object it returns.
  return definePlugin({
    name: 'sanity-plugin-async-list',
    schema: schema(config),
  })()
}
