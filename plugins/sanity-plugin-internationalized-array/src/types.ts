import type {LanguageFilterConfig} from '@sanity/language-filter'
import type {FieldDefinition, Rule, RuleTypeConstraint, SanityClient} from 'sanity'
export type Language = {
  id: Intl.UnicodeBCP47LocaleIdentifier
  title: string
}

export type AllowedType = 'string' | 'number' | 'boolean' | 'text' | 'reference'

export type ArrayConfig = {
  name: string
  type: AllowedType
  languages: Language[]
  title?: string
  group?: string
  hidden?: boolean | (() => boolean)
  readOnly?: boolean | (() => boolean)
  validation?: Rule | Rule[]
  field?: {[key: string]: unknown; options: {[key: string]: unknown}}
}

/**
 * @deprecated Use InternationalizedArrayItem instead
 */
export type Value = {
  _key: string
  /** Language identifier (e.g., 'en', 'fr'). Added in v5. */
  language: string
  value?: unknown
}

export function isInternationalizedArrayItemType(
  type: string,
): type is InternationalizedArrayItem['_type'] {
  return type.startsWith('internationalizedArray') && type.endsWith('Value')
}

export type InternationalizedArrayItem<T = unknown> = {
  _key: string
  value?: T
  /** Language identifier (e.g., 'en', 'fr'). Added in v5. */
  language: string
  /**
   * string that starts with "internationalizedArray" and ends with "Value"
   */
  _type: `internationalizedArray${string}Value`
}

export type LanguageCallback = (
  client: SanityClient,
  selectedValue: Record<string, unknown>,
) => Promise<Language[]>

export type LanguageDisplay = 'titleOnly' | 'codeOnly' | 'titleAndCode'

/**
 * Context passed to `filterLanguages` when the plugin is computing the list
 * of languages to render in the add-language buttons (and to use for "add
 * missing languages"). The `schemaType` is the document type currently in
 * the form; `defaultLanguages` is the fully-resolved list from the plugin's
 * `languages` option (after any async function has settled and after any
 * `@sanity/language-filter` user selection has been applied).
 */
export type FilterLanguagesContext = {
  schemaType: string
  defaultLanguages: Language[]
}

/**
 * Synchronous, per-schemaType filter applied to the language list used by
 * the add-language buttons and the "add missing languages" action. Receives
 * the resolved `defaultLanguages` and returns a (possibly reordered, possibly
 * empty) subset.
 *
 * The filter affects the UI surface only. Existing values in an
 * `internationalizedArray*` field are never removed or hidden by it, so
 * documents that already contain a language you later filter out keep their
 * data and continue to render normally.
 */
export type FilterLanguages = (context: FilterLanguagesContext) => Language[]

export type PluginConfig = {
  /**
   * https://www.sanity.io/docs/api-versioning
   * @defaultValue '2025-10-15'
   */
  apiVersion?: string
  /**
   * Specify fields that should be available in the language callback:
   * ```tsx
   * {
   *   select: {
   *     markets: 'markets'
   *   },
   *   languages: (client, {markets}) =>
   *     query.fetch(groq`*[_type == "language" && market in $markets]{id,title}`, {markets})
   * }
   * ```
   */
  select?: Record<string, string>
  /**
   * You can give it an array of language definitions:
   * ```tsx
   * {
   *   languages: [
   *     {id: 'en', title: 'English'},
   *     {id: 'fr', title: 'French'}
   *   ]
   * }
   * ```
   * You can load them async by passing a function that returns a promise:
   * ```tsx
   * {
   *   languages: async () => {
   *     const response = await fetch('https://example.com/languages')
   *     return response.json()
   *   }
   * }
   * ```
   * You can query your dataset for languages::
   * ```tsx
   * {
   *   languages: (client) =>
   *     query.fetch(groq`*[_type == "language"]{id,title}`)
   * }
   * ```
   */
  languages: Language[] | LanguageCallback
  /**
   * You can specify a list of language IDs that should be pre-filled when creating a new document
   * ```tsx
   * {
   *  defaultLanguages: ['en']
   * }
   * ```
   */
  defaultLanguages?: string[]
  /**
   * Can be a string matching core field types, as well as custom ones:
   * ```tsx
   * {
   *   fieldTypes: [
   *     "date", "datetime", "file", "image", "number", "string", "text", "url"
   *   ]
   * }
   * ```
   * You can also define a type directly:
   * ```tsx
   * {
   *   fieldTypes: [
   *     defineField({
   *       name: 'featuredProduct',
   *       type: 'reference',
   *       to: [{type: 'product'}]
   *       hidden: (({document}) => !document?.title)
   *     })
   *   ]
   * }
   * ```
   */
  // oxlint-disable-next-line typescript-eslint/no-redundant-type-constituents
  fieldTypes: (string | RuleTypeConstraint | FieldDefinition)[]
  /**
   * Locations where the "+ EN" add language buttons are visible
   * @defaultValue ['field']
   * */
  buttonLocations?: ('field' | 'unstable__fieldAction' | 'document')[]
  /**
   * Show or hide the "Add missing languages" button
   * @defaultValue true
   * */
  buttonAddAll?: boolean
  /**
   * How to display the languages on buttons and fields
   * @defaultValue 'code'
   * */
  languageDisplay?: LanguageDisplay
  /**
   * @internal
   * Function to determine if the plugin layout and root input should be included for a given document type.
   * @defaultValue (documentType) => documentType !== 'translation.metadata'
   * @example
   * {
   *   includeForDocumentType: (documentType) => documentType === 'translation.metadata'
   * }
   */
  includeForDocumentType?: (documentType: string) => boolean
  /**
   * Configure the language filter for the plugin by providing the document types that should show the filter.
   * ```tsx
   * {
   *   languageFilter: {
   *     documentTypes: ['internationalizedPost', 'lesson'],
   *     defaultLanguages: ['en']
   *   }
   * }
   * ```
   */
  languageFilter?: {
    documentTypes: Required<LanguageFilterConfig>['documentTypes']
    defaultLanguages?: LanguageFilterConfig['defaultLanguages']
  }
  /**
   * Narrow the list of languages shown in the add-language buttons (and used
   * by "add missing languages") per document type. Receives the document's
   * `schemaType` name and the resolved `defaultLanguages` list, and returns
   * the subset to render.
   *
   * Composes with `@sanity/language-filter` (configured via `languageFilter`
   * above): the static filter runs first to narrow the universe of
   * candidates, then the user's per-session language toggle is applied on
   * top. The filter only affects which buttons render; existing values in
   * the array are not removed or hidden.
   *
   * ```tsx
   * {
   *   filterLanguages: ({schemaType, defaultLanguages}) => {
   *     if (schemaType === 'recipe') {
   *       return defaultLanguages.filter((l) => ['en', 'it'].includes(l.id))
   *     }
   *     return defaultLanguages
   *   }
   * }
   * ```
   */
  filterLanguages?: FilterLanguages | null
}
