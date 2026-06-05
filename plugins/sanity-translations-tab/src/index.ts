import TranslationsTab from './components/TranslationsTab'
import {DummyAdapter} from './adapter'
import {
  Secrets,
  Adapter,
  ExportForTranslation,
  ImportTranslation,
  TranslationFunctionContext,
  TranslationsTabConfigOptions,
} from './types'
import {
  baseDocumentLevelConfig,
  legacyDocumentLevelConfig,
  legacyDocumentLevelPatch,
  baseFieldLevelConfig,
  baseI18nArrayConfig,
  findLatestDraft,
  documentLevelPatch,
  fieldLevelPatch,
  i18nArrayPatch,
} from './configuration'
import {
  BaseDocumentSerializer,
  BaseDocumentDeserializer,
  BaseDocumentMerger,
  defaultStopTypes,
  customSerializers,
  SerializedDocument,
} from 'sanity-naive-html-serializer'

export type {
  Secrets,
  Adapter,
  ExportForTranslation,
  ImportTranslation,
  TranslationFunctionContext,
  TranslationsTabConfigOptions,
  SerializedDocument,
}
export {
  TranslationsTab,
  DummyAdapter,
  //helpers for setting up easy, standard configuration across different translation vendors
  baseDocumentLevelConfig,
  legacyDocumentLevelConfig,
  baseFieldLevelConfig,
  baseI18nArrayConfig,
  //helpers for end developers who may need to customize serialization
  findLatestDraft,
  legacyDocumentLevelPatch,
  documentLevelPatch,
  fieldLevelPatch,
  i18nArrayPatch,
  BaseDocumentSerializer,
  BaseDocumentDeserializer,
  BaseDocumentMerger,
  defaultStopTypes,
  customSerializers,
}
