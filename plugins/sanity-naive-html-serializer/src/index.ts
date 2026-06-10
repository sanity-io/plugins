export {BaseDocumentMerger} from './BaseDocumentMerger'
export {BaseDocumentSerializer} from './BaseDocumentSerializer'
export {BaseDocumentDeserializer} from './BaseDocumentDeserializer'
export {
  defaultStopTypes,
  customSerializers,
  customBlockDeserializers,
} from './BaseSerializationConfig'
export {getItemLanguage, usesLanguageField, LANGUAGE_FIELD} from './internationalizedArrayHelpers'

export type {SerializedDocument, Serializer, SerializerClosure, Deserializer, Merger} from './types'
