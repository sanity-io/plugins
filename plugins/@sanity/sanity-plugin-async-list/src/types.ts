import type {AutocompleteProps} from '@sanity/ui/autocomplete'
import type {AllHTMLAttributes, ClassAttributes, Ref} from 'react'
import type {SanityClient, SourceClientOptions} from 'sanity'

interface HTMLProps<T> extends AllHTMLAttributes<T>, ClassAttributes<T> {}

/**
 * Minimum option stored by async-list. `value` is written to the field.
 *
 * Pass a narrower type to {@link AsyncListPluginConfig}, `asyncList`, or
 * `createAsyncListInput` so `renderOption`, `renderValue`, and `filterOption`
 * receive it:
 *
 * ```ts
 * type Character = {value: string; name: string}
 *
 * asyncList<Character>({
 *   schemaType: 'character',
 *   loader: async () => [{value: '1', name: 'Elsa'}],
 *   autocompleteProps: {
 *     renderValue: (value, option) => option?.name ?? value,
 *   },
 * })
 * ```
 *
 * @public
 */
export interface AsyncListOption {
  value: string
}

/**
 * What `loader` must return. Extra fields stay allowed when `Option` is the
 * default `{value: string}`, matching loaders that attach metadata the input
 * does not read. `NoInfer` keeps that default from being inferred out of the
 * loader's return value — configure the option with an explicit type argument.
 */
type AsyncListLoaderOption<Option extends AsyncListOption> = NoInfer<Option> &
  Record<string, unknown>

type AsyncListAutocompleteProps<Option extends AsyncListOption> = Partial<
  AutocompleteProps<Option> &
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

export interface AsyncListPluginConfig<Option extends AsyncListOption = AsyncListOption> {
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
  }) => Promise<AsyncListLoaderOption<Option>[]>
  /**
   * Passthrough for Autocomplete component. Use to create custom item previews, modify search behavior, etc. https://www.sanity.io/ui/docs/component/autocomplete
   *
   * The option argument follows `Option`. With the default type it is `{value: string}`.
   */
  // TODO: there has to be a better way to get this type
  autocompleteProps?: AsyncListAutocompleteProps<NoInfer<Option>>
}

/**
 * Options for the `AsyncList` input component / `createAsyncListInput` factory.
 *
 * Same as {@link AsyncListPluginConfig}, but `schemaType` is optional because it
 * is only required when registering the `asyncList()` plugin (it is unused when
 * the input is wired manually as a component).
 */
export type AsyncListInputOptions<Option extends AsyncListOption = AsyncListOption> = Omit<
  AsyncListPluginConfig<Option>,
  'schemaType'
> &
  Partial<Pick<AsyncListPluginConfig<Option>, 'schemaType'>>
