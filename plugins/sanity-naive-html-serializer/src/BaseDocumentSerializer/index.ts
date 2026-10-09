import {type PortableTextTypeComponent, toHTML} from '@portabletext/to-html'
import type {SanityDocument, TypedObject, Schema} from 'sanity'

import {defaultStopTypes, customSerializers} from '../BaseSerializationConfig'
import type {TranslationLevel, SerializerClosure} from '../types'
import {fieldFilter, internationalizedArrayFilter, languageObjectFieldFilter} from './fieldFilters'

const META_FIELDS = ['_key', '_type', '_id', '_weak']

type RawSchemaNode = {
  name?: string
  type?: string
  fields?: RawSchemaNode[]
  of?: RawSchemaNode[]
}

/*
 * Top-level types win over inline array members of the same name.
 * Anonymous object fields are not indexed: their stored `_type` is `object`,
 * so they have to be resolved from the parent field definition instead.
 */
function indexRawTypes(types: RawSchemaNode[]): Map<string, RawSchemaNode> {
  const index = new Map<string, RawSchemaNode>()

  const addNamedObject = (typeDef: RawSchemaNode | undefined) => {
    if (!typeDef?.name || !Array.isArray(typeDef.fields) || index.has(typeDef.name)) return
    index.set(typeDef.name, typeDef)
  }

  const visit = (node: RawSchemaNode | undefined) => {
    if (!node) return
    node.fields?.forEach(visit)
    node.of?.forEach((member) => {
      addNamedObject(member)
      visit(member)
    })
  }

  types.forEach(addNamedObject)
  types.forEach(visit)
  return index
}

/*
 * `fieldFilter` keeps only known schema fields. Keys the schema does not
 * mention are copied back so anonymous objects can still round-trip data
 * that was never declared.
 */
function filterWithSchema(
  obj: Record<string, any>,
  fields: RawSchemaNode[],
  stopTypes: string[],
): TypedObject {
  const filtered = fieldFilter(obj, fields as any, stopTypes)
  const schemaNames = new Set(fields.map((field) => field.name))
  for (const key of Object.keys(obj)) {
    if (key !== '_type' && !schemaNames.has(key) && obj[key]) {
      filtered[key] = obj[key]
    }
  }
  return filtered
}

export const BaseDocumentSerializer: SerializerClosure = (schemas: Schema) => {
  /*
   * Helper function that allows us to get metadata (like `localize: false`) from schema fields.
   * Includes named object types declared inline in array `of` arrays, which are not
   * present on `schemas._original.types`.
   */
  const typesByName = indexRawTypes(schemas?._original?.types ?? [])
  const getSchema = (name?: string) => (name ? typesByName.get(name) : undefined)

  const resolveObjectType = (fieldDef: RawSchemaNode | undefined, value: TypedObject) => {
    if (fieldDef?.type === 'object' && Array.isArray(fieldDef.fields)) {
      return fieldDef
    }
    const fromValue = value?._type ? getSchema(value._type) : undefined
    if (fromValue?.fields) return fromValue
    if (typeof fieldDef?.type === 'string') {
      const fromField = getSchema(fieldDef.type)
      if (fromField?.fields) return fromField
    }
    return undefined
  }

  const resolveArrayMember = (fieldDef: RawSchemaNode | undefined, block: Record<string, any>) => {
    // Items with no `_type` must not be matched to an anonymous object member.
    if (!fieldDef?.of || typeof block?._type !== 'string' || !block._type) {
      return block?._type ? getSchema(block._type) : undefined
    }
    const member = fieldDef.of.find(
      (candidate) => candidate.name === block._type || candidate.type === block._type,
    )
    if (member && Array.isArray(member.fields)) return member
    if (typeof member?.type === 'string') {
      const named = getSchema(member.type)
      if (named?.fields) return named
    }
    if (member?.name) {
      const named = getSchema(member.name)
      if (named?.fields) return named
    }
    return getSchema(block._type)
  }

  const serializeObject = (
    obj: TypedObject,
    stopTypes: string[],
    serializers: Record<string, any>,
    typeDef?: RawSchemaNode,
  ) => {
    if (stopTypes.includes(obj._type)) {
      return ''
    }

    // if user has declared a custom serializer, use that
    // instead of this method
    const hasSerializer = serializers.types && Object.keys(serializers.types).includes(obj._type)
    if (hasSerializer) {
      return toHTML([obj], {components: serializers})
    }

    // we don't need to worry about PT types
    if (obj._type === 'span' || obj._type === 'block') {
      return toHTML(obj, {components: serializers})
    }

    // Custom serializers and Portable Text already returned above, so they still see
    // the original value. Everything else honors `localize: false` and stop types,
    // including nested and inline objects that never reach the document-root filter.
    const schema = typeDef?.fields ? typeDef : getSchema(obj._type)
    const source: TypedObject = schema?.fields
      ? filterWithSchema(obj, schema.fields, stopTypes)
      : obj

    // If schema is available, encode values in the order they're declared in the schema,
    // since this will likely be more intuitive for a translator.
    let fieldNames = Object.keys(source).filter((key) => key !== '_type')
    if (schema?.fields) {
      const ordered = schema.fields
        .map((field) => field.name)
        .filter((schemaKey): schemaKey is string => !!schemaKey && Object.hasOwn(source, schemaKey))
      const orderedNames = new Set(ordered)
      const extras = fieldNames.filter((key) => !orderedNames.has(key))
      fieldNames = [...ordered, ...extras]
    }

    //account for anonymous inline objects
    if (typeof source === 'object' && !source._type) {
      source._type = ''
    }

    // In some cases, we might recurse through many objects of the same type.
    // We should take all methods necessary to ensure state does not persist
    // otherwise we risk using old serialization methods on new items.
    const newSerializationMethods: Record<string, PortableTextTypeComponent> = {}
    const tempType = `${source._type}__temp_type__${Math.random().toString(36).substring(7)}`
    const objToSerialize: TypedObject = {_type: tempType}
    // For our default serialization method, we only need to
    // capture metadata. The rest will be recursively turned into strings.
    META_FIELDS.filter((f) => f !== '_type').forEach((field) => {
      objToSerialize[field] = source[field]
    })

    let innerHTML = ''

    // If it's a custom object, iterate through its keys to find and serialize translatable content.
    fieldNames.forEach((fieldName) => {
      let htmlField = ''

      if (!META_FIELDS.includes(fieldName)) {
        const value = source[fieldName]
        const fieldDef = schema?.fields?.find((field) => field.name === fieldName)
        // Strings are either string fields or have recursively been turned
        // into HTML because they were a nested object or array.
        if (typeof value === 'string') {
          const htmlRegex = new RegExp(/<("[^"]*"|'[^']*'|[^'">])*>/)
          if (htmlRegex.test(value)) {
            htmlField = value
          } else {
            htmlField = `<span class="${fieldName}">${value}</span>`
          }
        }

        // Array fields get filtered and its children serialized.
        else if (Array.isArray(value)) {
          htmlField = serializeArray(
            value,
            fieldName,
            stopTypes,
            {
              ...serializers,
              types: {...serializers.types},
            },
            fieldDef,
          )
        }

        // This is an object in an object, serialize it first.
        else {
          const embeddedObject = value as TypedObject
          const objHTML = serializeObject(
            embeddedObject,
            stopTypes,
            {
              ...serializers,
              types: {...serializers.types},
            },
            resolveObjectType(fieldDef, embeddedObject),
          )
          htmlField = `<div class="${fieldName}" data-level="field">${objHTML}</div>`
        }

        innerHTML += htmlField
      }
    })

    if (!innerHTML) {
      return ''
    }

    newSerializationMethods[tempType] = ({value}: {value: TypedObject}) => {
      let div = `<div class="${value._type.split('__temp_type__')[0]}"`
      if (value._key || value._id) {
        div += `id="${value._key ?? value._id}"`
      }

      return [div, ` data-type="object">${innerHTML}</div>`].join('')
    }

    let serializedBlock = ''
    try {
      serializedBlock = toHTML(objToSerialize, {
        components: {
          ...serializers,
          types: {
            ...serializers.types,
            ...newSerializationMethods,
          },
        },
      })
    } catch (err) {
      console.warn(
        `Had issues serializing block of type "${source._type}". Please specify a serialization method for this block in your serialization config. Received error: ${err}`,
      )
    }

    return serializedBlock
  }

  const serializeArray = (
    fieldContent: Record<string, any>[],
    fieldName: string,
    stopTypes: string[],
    serializers: Record<string, any>,
    fieldDef?: RawSchemaNode,
  ) => {
    // Filter for any blocks that user has indicated
    // should not be sent for translation.
    const validBlocks = fieldContent.filter((block) => !stopTypes.includes(block._type))

    // Take out any fields in these blocks that should
    // not be sent to translation.
    const filteredBlocks = validBlocks.map((block) => {
      if (!block || typeof block !== 'object') return block
      const schema = resolveArrayMember(fieldDef, block)
      if (schema?.fields) {
        return fieldFilter(block, schema.fields as any, stopTypes)
      }
      return block
    })

    const output = filteredBlocks.map((obj) => {
      // If object in array is just a string, just return it.
      if (typeof obj === 'string') {
        return `<span>${obj}</span>`
      }
      // Send to serialization method.
      const memberSchema =
        obj && typeof obj === 'object' ? resolveArrayMember(fieldDef, obj) : undefined
      return serializeObject(obj as TypedObject, stopTypes, serializers, memberSchema)
    })

    // Encode this with data-level field.
    return `<div class="${fieldName}" data-type="array">${output.join('')}</div>`
  }

  /*
   * Main parent function: finds fields to translate, and feeds them to appropriate child serialization
   * methods.
   */
  const serializeDocument = (
    doc: SanityDocument,
    translationLevel: TranslationLevel = 'document',
    baseLang = 'en',
    stopTypes = defaultStopTypes,
    serializers = customSerializers,
  ) => {
    const schema = getSchema(doc._type)
    let filteredObj: Record<string, any> = {}

    // Field level translations explicitly send over any fields that
    // match the base language, regardless of depth.
    if (translationLevel === 'field') {
      filteredObj = languageObjectFieldFilter(doc, baseLang)
    }
    // InternationalizedArray level translations send over fields
    // that follow the _type naming pattern and have a _key of the base language.
    else if (translationLevel === 'internationalizedArray') {
      filteredObj = internationalizedArrayFilter(doc, baseLang)
    }
    // Otherwise, we can refer to the schema and a list of stop types
    // to determine what should not be sent.
    else {
      filteredObj = fieldFilter(doc, schema!.fields as any, stopTypes)
    }

    const serializedFields: Record<string, any> = {}

    for (const key in filteredObj) {
      if (!filteredObj.hasOwnProperty(key)) continue
      const value: Record<string, any> | Array<any> | string = filteredObj[key]

      const fieldDef = schema?.fields?.find((field: RawSchemaNode) => field.name === key)
      if (typeof value === 'string') {
        serializedFields[key] = value
      } else if (Array.isArray(value)) {
        serializedFields[key] = serializeArray(value, key, stopTypes, serializers, fieldDef)
      } else if (value && !stopTypes.find((stopType) => stopType == value?._type)) {
        const serialized = serializeObject(
          value as TypedObject,
          stopTypes,
          serializers,
          resolveObjectType(fieldDef, value as TypedObject),
        )
        serializedFields[key] = `<div class="${key}" data-level='field'>${serialized}</div>`
      }
    }

    // Create a valid HTML file.
    const rawHTMLBody = document.createElement('body')
    rawHTMLBody.innerHTML = serializeObject(serializedFields as TypedObject, stopTypes, serializers)

    const rawHTMLHead = document.createElement('head')
    const metaFields = ['_id', '_type', '_rev']
    // Save our metadata as meta tags so we can use them later on.
    metaFields.forEach((field) => {
      const metaEl = document.createElement('meta')
      metaEl.setAttribute('name', field)
      metaEl.setAttribute('content', doc[field] as string)
      rawHTMLHead.appendChild(metaEl)
    })
    // Encode version so we can use the correct deserialization methods.
    const versionMeta = document.createElement('meta')
    versionMeta.setAttribute('name', 'version')
    versionMeta.setAttribute('content', '3')
    rawHTMLHead.appendChild(versionMeta)

    const rawHTML = document.createElement('html')
    rawHTML.appendChild(rawHTMLHead)
    rawHTML.appendChild(rawHTMLBody)

    return {
      name: doc._id,
      content: rawHTML.outerHTML,
    }
  }

  return {
    serializeDocument,
    fieldFilter,
    languageObjectFieldFilter,
    internationalizedArrayFilter,
    serializeArray,
    serializeObject,
  }
}
