import type {
  DocumentLanguageFilterContext,
  FieldDefinition,
  ObjectSchemaType,
  Reference,
  SanityClient,
  SanityDocument,
  SanityDocumentLike,
} from 'sanity'
import type {
  InternationalizedArrayItem,
  PluginConfig as InternationalizedArrayPluginConfig,
} from 'sanity-plugin-internationalized-array'

export type Language = {
  id: Intl.UnicodeBCP47LocaleIdentifier
  title: string
}

export type SupportedLanguages = Language[] | ((client: SanityClient) => Promise<Language[]>)

export type PluginCallbackArgs = {
  sourceDocument: SanityDocument
  newDocument: SanityDocument
  sourceLanguageId: string
  destinationLanguageId: string
  metaDocumentId: string
  client: SanityClient
}

/**
 * Context passed to `languageFilter` when the Translations menu renders.
 * Receives the schema type name of the document the menu is being rendered
 * against, plus the fully resolved list of supported languages (the same
 * list `supportedLanguages` produces).
 */
export type LanguageFilterContext = {
  schemaType: string
  defaultLanguages: Language[]
}

/**
 * Synchronous filter applied to the language list shown in the Translations
 * menu, scoped per document type. Receives the resolved `defaultLanguages`
 * and must return a (possibly reordered, possibly empty) subset.
 *
 * The filter only affects the menu UI. Templates, badges, language patches
 * driven from `supportedLanguages` and the data layer all keep using the
 * full, unfiltered list, so existing translated documents never lose their
 * badges or become unrouteable.
 */
export type LanguageFilter = (context: LanguageFilterContext) => Language[]

export type PluginConfig = {
  supportedLanguages: SupportedLanguages
  schemaTypes: string[]
  languageField?: string
  weakReferences?: boolean
  bulkPublish?: boolean
  metadataFields?: FieldDefinition[]
  apiVersion?: string
  allowCreateMetaDoc?: boolean
  callback?: ((args: PluginCallbackArgs) => Promise<void>) | null
  /**
   * Restrict which languages appear in the Translations menu for a given
   * schema type. Runs at menu render time, after `supportedLanguages` has
   * been resolved. Returning an empty array yields a menu with no language
   * options (the Manage Translations button still renders).
   *
   * Only the menu is affected. See {@link LanguageFilter} for details.
   */
  languageFilter?: LanguageFilter | null
  hideLanguageFilter?: boolean | string[] | ((ctx: DocumentLanguageFilterContext) => boolean)
  /**
   * Allows configuring the behavior of the internationalized array for the metadata document.
   */
  metadataInternationalization?: Pick<
    InternationalizedArrayPluginConfig,
    'buttonLocations' | 'buttonAddAll' | 'languageDisplay'
  >
  /**
   * Set to false to prevent templates from being created for each schemaType and language.
   */
  addTemplates?: boolean
}

// Context version of config
// should have processed the
// supportedLanguages function
export type PluginConfigContext = Required<Omit<PluginConfig, 'metadataInternationalization'>> & {
  supportedLanguages: Language[]
  metadataInternationalization?: Pick<
    InternationalizedArrayPluginConfig,
    'buttonLocations' | 'buttonAddAll' | 'languageDisplay'
  >
}

export type TranslationReference = InternationalizedArrayItem<Reference> & {
  _type: 'internationalizedArrayReferenceValue'
  value: Reference
}

export type Metadata = {
  _id: string
  _createdAt: string
  translations: TranslationReference[]
}

export type MetadataDocument = SanityDocumentLike & {
  schemaTypes: string[]
  translations: TranslationReference[]
}

export type DocumentInternationalizationMenuProps = {
  schemaType: ObjectSchemaType
  documentId: string
}

// Extend Sanity schema definitions
export interface DocumentInternationalizationSchemaOpts {
  documentInternationalization?: {
    /** Set to true to disable duplication of this field or type */
    exclude?: boolean
  }
}

declare module 'sanity' {
  interface ArrayOptions extends DocumentInternationalizationSchemaOpts {}
  interface BlockOptions extends DocumentInternationalizationSchemaOpts {}
  interface BooleanOptions extends DocumentInternationalizationSchemaOpts {}
  interface CrossDatasetReferenceOptions extends DocumentInternationalizationSchemaOpts {}
  interface DateOptions extends DocumentInternationalizationSchemaOpts {}
  interface DatetimeOptions extends DocumentInternationalizationSchemaOpts {}
  interface FileOptions extends DocumentInternationalizationSchemaOpts {}
  interface GeopointOptions extends DocumentInternationalizationSchemaOpts {}
  interface ImageOptions extends DocumentInternationalizationSchemaOpts {}
  interface NumberOptions extends DocumentInternationalizationSchemaOpts {}
  interface ObjectOptions extends DocumentInternationalizationSchemaOpts {}
  interface ReferenceBaseOptions extends DocumentInternationalizationSchemaOpts {}
  interface SlugOptions extends DocumentInternationalizationSchemaOpts {}
  interface StringOptions extends DocumentInternationalizationSchemaOpts {}
  interface TextOptions extends DocumentInternationalizationSchemaOpts {}
  interface UrlOptions extends DocumentInternationalizationSchemaOpts {}
  interface EmailOptions extends DocumentInternationalizationSchemaOpts {}
}
