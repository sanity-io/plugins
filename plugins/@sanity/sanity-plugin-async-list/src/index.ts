import type {AutocompleteProps} from '@sanity/ui'
import type {AllHTMLAttributes, ClassAttributes, Ref} from 'react'
import {definePlugin, type SanityClient, type SourceClientOptions} from 'sanity'

import {AsyncList} from './components/async-list'
import {schema} from './schema-types'

export {AsyncList}
interface HTMLProps<T> extends AllHTMLAttributes<T>, ClassAttributes<T> {}
export interface AsyncListPluginConfig {
  /**
   * Field type name for list
   */
  schemaType: string
  /**
   * Declare secrets needed for loader
   */
  secrets?: {
    namespace?: string
    title?: string
    keys: {
      key: string
      title: string
      description?: string
    }[]
  }
  /**
   * Config for client passed to `loader`
   */
  clientOptions?: SourceClientOptions
  /**
   * Defaults to 'seed', but 'search' will re-run the loader while passing the `query` user's type into the input
   */
  loaderType?: 'search' | 'seed'
  /**
   * Fetch data and return options for the sanity/ui Autocomplete component. When using `loaderType: 'search'` `loader` receives a `query` from user input to be used in fetching data.
   */
  loader: ({
    secrets,
    query,
    client,
  }: {
    secrets?: Record<string, string>
    query?: string
    client: SanityClient
  }) => Promise<Array<{value: string} & Record<string, unknown>> | []>
  /**
   * Passthrough for Autocomplete component. Use to create custom item previews, modify search behavior, etc. https://www.sanity.io/ui/docs/component/autocomplete
   */
  // TODO: there has to be a better way to get this type
  autocompleteProps?: Partial<
    AutocompleteProps<{value: string}> &
      Omit<
        HTMLProps<HTMLInputElement>,
        | 'aria-activedescendant'
        | 'aria-autocomplete'
        | 'aria-expanded'
        | 'aria-owns'
        | 'as'
        | 'autoCapitalize'
        | 'autoComplete'
        | 'autoCorrect'
        | 'id'
        | 'inputMode'
        | 'onChange'
        | 'onSelect'
        | 'prefix'
        | 'ref'
        | 'role'
        | 'spellCheck'
        | 'type'
        | 'value'
      > & {
        ref?: Ref<HTMLInputElement>
      }
  >
}

/**
 * Usage in `sanity.config.ts` (or .js)
 *
 * ```ts
 * import {defineConfig} from 'sanity'
 * import {myPlugin} from 'sanity-plugin-async-list'
 *
 * export default defineConfig({
 *   // ...
 *   plugins: [myPlugin()],
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
