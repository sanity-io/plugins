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

const PORTABLE_TEXT_TYPES = new Set(['block', 'span'])

function isPortableTextType(typeName: unknown): typeName is string {
  return typeof typeName === 'string' && PORTABLE_TEXT_TYPES.has(typeName)
}

/*
 * Top-level types win over inline array members of the same name.
 * Named array types are indexed too, so a field can follow `type: 'heroSlides'`
 * back to that array's own `of` list. Anonymous object fields are not indexed:
 * their stored `_type` is `object` or missing, so they are resolved from the
 * parent field definition instead.
 */
function indexRawTypes(types: RawSchemaNode[]): Map<string, RawSchemaNode> {
  const index = new Map<string, RawSchemaNode>()

  const addNamedType = (typeDef: RawSchemaNode | undefined) => {
    if (!typeDef?.name || index.has(typeDef.name)) return
    if (!Array.isArray(typeDef.fields) && !Array.isArray(typeDef.of)) return
    index.set(typeDef.name, typeDef)
  }

  const visit = (node: RawSchemaNode | undefined) => {
    if (!node) return
    node.fields?.forEach(visit)
    node.of?.forEach((member) => {
      addNamedType(member)
      visit(member)
    })
  }

  types.forEach(addNamedType)
  types.forEach(visit)
  return index
}

/*
 * Anonymous objects (`_type` missing or `"object"`) still carry keys the schema
 * never declared, and those keys have to round-trip. Named objects do not:
 * copying undeclared keys into the translation HTML makes import rewrite them.
 */
function keepsUndeclaredKeys(schema: RawSchemaNode, obj: Record<string, any>): boolean {
  const storedType = typeof obj?._type === 'string' ? obj._type : ''
  if (!storedType || storedType === 'object') return true
  return schema.type === 'object' && !!schema.name && schema.name !== storedType
}

function filterWithSchema(
  obj: Record<string, any>,
  fields: RawSchemaNode[],
  stopTypes: string[],
  keepUndeclared: boolean,
): TypedObject {
  const filtered = fieldFilter(obj, fields as any, stopTypes)
  if (!keepUndeclared) return filtered
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
    // The field's declared type wins over `_type`. Inline members share names
    // across arrays, and the first one indexed under that name is not this field.
    if (typeof fieldDef?.type === 'string' && fieldDef.type !== 'object') {
      const fromField = getSchema(fieldDef.type)
      if (fromField?.fields) return fromField
    }
    const fromValue = value?._type ? getSchema(value._type) : undefined
    if (fromValue?.fields) return fromValue
    return undefined
  }

  const resolveArrayField = (fieldDef: RawSchemaNode | undefined) => {
    if (!fieldDef) return undefined
    if (Array.isArray(fieldDef.of)) return fieldDef
    if (typeof fieldDef.type === 'string') {
      const named = getSchema(fieldDef.type)
      if (Array.isArray(named?.of)) return named
    }
    return undefined
  }

  const resolveArrayMember = (fieldDef: RawSchemaNode | undefined, block: Record<string, any>) => {
    // Portable Text carries `children` and `markDefs`, which are not on the raw
    // block member. Filtering with that member's custom `fields` drops the text.
    if (!block || typeof block !== 'object' || isPortableTextType(block._type)) return undefined

    const arrayDef = resolveArrayField(fieldDef)
    const objectMembers = (arrayDef?.of ?? []).filter(
      (member) => member.type === 'object' && Array.isArray(member.fields),
    )
    // Studio stores an unnamed array object with no `_type` (or `_type: 'object'`).
    // Use its field list only when that member is the only object in the array.
    if (typeof block._type !== 'string' || !block._type || block._type === 'object') {
      return objectMembers.length === 1 ? objectMembers[0] : undefined
    }
    if (!arrayDef?.of) {
      const named = getSchema(block._type)
      return named?.fields ? named : undefined
    }
    const member = arrayDef.of.find(
      (candidate) => candidate.name === block._type || candidate.type === block._type,
    )
    if (member && isPortableTextType(member.type)) return undefined
    if (member && Array.isArray(member.fields)) return member
    if (typeof member?.type === 'string') {
      const named = getSchema(member.type)
      if (named?.fields) return named
    }
    if (member?.name) {
      const named = getSchema(member.name)
      if (named?.fields) return named
    }
    const named = getSchema(block._type)
    return named?.fields ? named : undefined
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

    // Portable Text is serialized whole. Custom block fields stay on the value;
    // the block components render `children`, and filtering first would remove them.
    if (isPortableTextType(obj._type)) {
      if (serializers.types && Object.keys(serializers.types).includes(obj._type)) {
        return toHTML([obj], {components: serializers})
      }
      return toHTML(obj, {components: serializers})
    }

    // Honor `localize: false` and stop types before a custom serializer sees the
    // value, including nested and inline objects that never reach the document-root filter.
    const schema = typeDef?.fields ? typeDef : getSchema(obj._type)
    const source: TypedObject = schema?.fields
      ? filterWithSchema(obj, schema.fields, stopTypes, keepsUndeclaredKeys(schema, obj))
      : obj

    if (serializers.types && Object.keys(serializers.types).includes(obj._type)) {
      return toHTML([source], {components: serializers})
    }

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
      if (!block || typeof block !== 'object' || isPortableTextType(block._type)) return block
      const schema = resolveArrayMember(fieldDef, block)
      if (schema?.fields) {
        return filterWithSchema(block, schema.fields, stopTypes, keepsUndeclaredKeys(schema, block))
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
