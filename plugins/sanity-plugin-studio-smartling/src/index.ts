import {
  TranslationsTab,
  baseDocumentLevelConfig,
  legacyDocumentLevelConfig as baseLegacyDocumentLevelConfig,
  baseFieldLevelConfig,
  findLatestDraft,
  BaseDocumentDeserializer,
  BaseDocumentSerializer,
  BaseDocumentMerger,
  defaultStopTypes,
  customSerializers,
  legacyDocumentLevelPatch,
  documentLevelPatch,
  fieldLevelPatch,
  TranslationFunctionContext,
  TranslationsTabConfigOptions,
} from 'sanity-translations-tab'
import {SmartlingAdapter} from './adapter'

const defaultDocumentLevelConfig: TranslationsTabConfigOptions = {
  ...baseDocumentLevelConfig,
  adapter: SmartlingAdapter,
}

const legacyDocumentLevelConfig: TranslationsTabConfigOptions = {
  ...baseLegacyDocumentLevelConfig,
  adapter: SmartlingAdapter,
}

const defaultFieldLevelConfig: TranslationsTabConfigOptions = {
  ...baseFieldLevelConfig,
  adapter: SmartlingAdapter,
}

export {
  TranslationsTab,
  findLatestDraft,
  legacyDocumentLevelPatch,
  documentLevelPatch,
  fieldLevelPatch,
  BaseDocumentDeserializer,
  BaseDocumentSerializer,
  BaseDocumentMerger,
  defaultStopTypes,
  customSerializers,
  SmartlingAdapter,
  legacyDocumentLevelConfig,
  defaultDocumentLevelConfig,
  defaultFieldLevelConfig,
}

export type {TranslationFunctionContext, TranslationsTabConfigOptions}
