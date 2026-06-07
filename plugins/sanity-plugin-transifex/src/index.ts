import {
  baseDocumentLevelConfig,
  legacyDocumentLevelConfig as baseLegacyDocumentLevelConfig,
  baseFieldLevelConfig,
  Adapter,
  TranslationFunctionContext,
} from 'sanity-translations-tab'
import {TransifexAdapter} from './transifexAdapter'

export {
  findLatestDraft,
  BaseDocumentDeserializer,
  BaseDocumentSerializer,
  BaseDocumentMerger,
  defaultStopTypes,
  customSerializers,
  legacyDocumentLevelPatch,
  documentLevelPatch,
  fieldLevelPatch,
  TranslationsTab,
} from 'sanity-translations-tab'

interface ConfigOptions {
  adapter: Adapter
  secretsNamespace: string | null
  exportForTranslation: (
    id: string,
    context: TranslationFunctionContext
  ) => Promise<Record<string, any>>
  importTranslation: (
    id: string,
    localeId: string,
    doc: string,
    context: TranslationFunctionContext
  ) => Promise<void>
}
const defaultDocumentLevelConfig: ConfigOptions = {
  ...baseDocumentLevelConfig,
  adapter: TransifexAdapter,
  secretsNamespace: 'transifex',
}

const legacyDocumentLevelConfig: ConfigOptions = {
  ...baseLegacyDocumentLevelConfig,
  adapter: TransifexAdapter,
  secretsNamespace: 'transifex',
}

const defaultFieldLevelConfig: ConfigOptions = {
  ...baseFieldLevelConfig,
  adapter: TransifexAdapter,
  secretsNamespace: 'transifex',
}

export {
  TransifexAdapter,
  defaultDocumentLevelConfig,
  defaultFieldLevelConfig,
  legacyDocumentLevelConfig,
}
