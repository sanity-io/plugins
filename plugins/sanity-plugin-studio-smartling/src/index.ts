import {
  baseDocumentLevelConfig,
  baseFieldLevelConfig,
  legacyDocumentLevelConfig as baseLegacyDocumentLevelConfig,
} from 'sanity-translations-tab'
import type {TranslationsTabConfigOptions} from 'sanity-translations-tab'

import {SmartlingAdapter} from './adapter'

export {
  BaseDocumentDeserializer,
  BaseDocumentMerger,
  BaseDocumentSerializer,
  customSerializers,
  defaultStopTypes,
  documentLevelPatch,
  fieldLevelPatch,
  findLatestDraft,
  legacyDocumentLevelPatch,
  TranslationsTab,
} from 'sanity-translations-tab'
export type {
  TranslationFunctionContext,
  TranslationsTabConfigOptions,
} from 'sanity-translations-tab'

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
  defaultDocumentLevelConfig,
  defaultFieldLevelConfig,
  legacyDocumentLevelConfig,
  SmartlingAdapter,
}
