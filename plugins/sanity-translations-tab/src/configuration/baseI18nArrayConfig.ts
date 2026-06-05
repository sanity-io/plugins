import {SanityClient, SanityDocument} from 'sanity'
import {
  BaseDocumentSerializer,
  BaseDocumentDeserializer,
  BaseDocumentMerger,
  SerializedDocument,
  defaultStopTypes,
  customSerializers,
  customBlockDeserializers,
} from 'sanity-naive-html-serializer'

import {DummyAdapter} from '../adapter'
import {ExportForTranslation, ImportTranslation} from '../types'
import {findLatestDraft, findDocumentAtRevision} from './utils'

export const i18nArrayPatch = async (
  documentId: string,
  translatedFields: SanityDocument,
  localeId: string,
  client: SanityClient,
  baseLanguage: string = 'en',
): Promise<void> => {
  let baseDoc: SanityDocument
  if (translatedFields._rev && translatedFields._id) {
    baseDoc = await findDocumentAtRevision(translatedFields._id, translatedFields._rev, client)
  } else {
    baseDoc = await findLatestDraft(documentId, client)
  }

  const arbitraryPosition = 1

  const mutations = BaseDocumentMerger.internationalizedArrayMerge(
    translatedFields,
    baseDoc,
    localeId,
    baseLanguage,
    arbitraryPosition,
  )

  const transaction = client.transaction()

  mutations.forEach((mutation: Record<string, any>) => {
    const {at, selector, items} = mutation
    transaction.patch(client.patch(baseDoc._id).insert(at, selector, items))
  })

  transaction.commit()
}

export const baseI18nArrayConfig = {
  exportForTranslation: async (
    ...params: Parameters<ExportForTranslation>
  ): Promise<SerializedDocument> => {
    const [id, context, baseLanguage = 'en', serializationOptions = {}] = params
    const {client, schema} = context
    const stopTypes = [...(serializationOptions.additionalStopTypes ?? []), ...defaultStopTypes]
    const serializers = {
      ...customSerializers,
      types: {
        ...customSerializers.types,
        ...(serializationOptions.additionalSerializers ?? {}),
      },
    }
    const doc = await findLatestDraft(id, client)
    const serialized = BaseDocumentSerializer(schema).serializeDocument(
      doc,
      'internationalizedArray',
      baseLanguage,
      stopTypes,
      serializers,
    )
    serialized.name = id
    return serialized
  },
  importTranslation: (...params: Parameters<ImportTranslation>): Promise<void> => {
    const [id, localeId, document, context, baseLanguage = 'en', serializationOptions = {}] = params
    const {client} = context
    const deserializers = {
      types: {
        ...(serializationOptions.additionalDeserializers ?? {}),
      },
    }
    const blockDeserializers = [
      ...(serializationOptions.additionalBlockDeserializers ?? []),
      ...customBlockDeserializers,
    ]

    const deserialized = BaseDocumentDeserializer.deserializeDocument(
      document,
      deserializers,
      blockDeserializers,
    ) as SanityDocument
    return i18nArrayPatch(id, deserialized, localeId, client, baseLanguage)
  },
  adapter: DummyAdapter,
  secretsNamespace: 'translationService',
  baseLanguage: 'en',
}
