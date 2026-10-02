// oxlint-disable no-accumulating-spread
import {extractWithPath} from '@sanity/mutator'
import {
  isArraySchemaType,
  isDocumentSchemaType,
  isIndexSegment,
  isIndexTuple,
  isKeySegment,
  isObjectSchemaType,
  isRecord,
  type ObjectSchemaType,
  type Path,
  type PathSegment,
  pathToString,
  type SanityDocumentLike,
  type SchemaType,
} from 'sanity'

import {randomKey} from '../_lib/randomKey'
import {isSchemaAssistEnabled} from '../helpers/assistSupported'
import type {DocumentMember, TranslationOutput, TranslationOutputsFunction} from './types'

export interface FieldLanguageMap {
  inputLanguageId: string
  inputPath: Path
  outputs: TranslationOutput[]
  relativeLanguagePath?: Path
}

const DEFAULT_MAX_DEPTH = 6
const ABSOLUTE_MAX_DEPTH = 50

export function getDocumentMembersFlat(
  doc: SanityDocumentLike,
  schemaType: ObjectSchemaType,
  maxDepth = DEFAULT_MAX_DEPTH,
) {
  if (!isDocumentSchemaType(schemaType)) {
    console.error(`Schema type is not a document`)
    return []
  }

  return extractPaths(doc, schemaType, [], Math.min(maxDepth, ABSOLUTE_MAX_DEPTH))
}

function extractPaths(
  doc: SanityDocumentLike,
  schemaType: ObjectSchemaType,
  path: Path,
  maxDepth: number,
): DocumentMember[] {
  if (path.length >= maxDepth) {
    return []
  }

  return schemaType.fields.reduce<DocumentMember[]>((acc, field) => {
    const fieldPath = [...path, field.name]
    const fieldSchema = field.type
    const parentValue = path.length ? extractWithPath(pathToString(path), doc)[0]?.value : doc
    const value = isRecord(parentValue) ? parentValue[field.name] : undefined

    if (value === undefined || value === null) {
      return acc
    }

    const thisFieldWithPath: DocumentMember = {
      path: fieldPath,
      name: field.name,
      schemaType: fieldSchema,
      value,
      parentValue,
    }

    if (fieldSchema.jsonType === 'object') {
      const innerFields = extractPaths(doc, fieldSchema, fieldPath, maxDepth)

      return [...acc, thisFieldWithPath, ...innerFields]
    } else if (
      fieldSchema.jsonType === 'array' &&
      fieldSchema.of.length &&
      fieldSchema.of.some((item) => 'fields' in item) &&
      // no reason to drill into arrays if the item fields will be culled by maxDepth, ie we need 1 extra path headroom
      path.length + 1 < maxDepth
    ) {
      const {value: arrayValue} = extractWithPath(pathToString(fieldPath), doc)[0] ?? {}

      let arrayPaths: DocumentMember[] = []
      // oxlint-disable-next-line no-unsafe-type-assertion
      if ((arrayValue as any)?.length) {
        // oxlint-disable-next-line no-unsafe-type-assertion
        for (const item of arrayValue as any[]) {
          const itemPath = [...fieldPath, {_key: item._key}]
          let itemSchema = fieldSchema.of.find((t) => t.name === item._type)
          if (!item._type) {
            itemSchema = fieldSchema.of[0]
            console.warn(
              'Array item is missing _type - using the first defined type in the array.of schema',
              {
                itemPath,
                item,
                itemSchema,
              },
            )
          }
          if (item._key && itemSchema) {
            const innerFields = extractPaths(
              doc,
              // oxlint-disable-next-line no-unsafe-type-assertion
              itemSchema as ObjectSchemaType,
              itemPath,
              maxDepth,
            )
            const arrayMember = {
              path: itemPath,
              name: item._key,
              schemaType: itemSchema,
              value: item,
              parentValue: arrayValue,
            }
            arrayPaths = [...arrayPaths, arrayMember, ...innerFields]
          }
        }
      }

      return [...acc, thisFieldWithPath, ...arrayPaths]
    }

    return [...acc, thisFieldWithPath]
  }, [])
}

type InternationalizedArrayItemValue = {
  language?: string // Available in >=v5
  _key?: string // In <v5 this represents the language identifier
  value?: unknown
}

const isInternationalizedArrayItemValue = (
  value: unknown,
): value is InternationalizedArrayItemValue =>
  typeof value === 'object' && value !== null && ('language' in value || '_key' in value)

export const defaultLanguageOutputs: TranslationOutputsFunction = function (
  member,
  enclosingType,
  translateFromLanguageId,
  translateToLanguageIds,
) {
  if (
    member.schemaType.jsonType === 'object' &&
    member.schemaType.name.startsWith('internationalizedArray') &&
    isInternationalizedArrayItemValue(member.value)
  ) {
    const isV5InternationalizedArrayItem = member.value.language !== undefined

    if (isV5InternationalizedArrayItem) {
      const language = member.value.language
      return language === translateFromLanguageId
        ? translateToLanguageIds.map((translateToId) => {
            const outputPathKey =
              (Array.isArray(member.parentValue)
                ? member.parentValue
                : ([] as InternationalizedArrayItemValue[])
              )
                // Uses parent value to verify if the item is already translated to the target language and reuse the key if it is
                .find((item) => item.language === translateToId)?._key || randomKey()

            return {
              id: translateToId,
              outputPath: [...member.path.slice(0, -1), {_key: outputPathKey}],
            }
          })
        : undefined
    }

    const pathEnd = member.path.slice(-1)

    const language = pathEnd[0] && isKeySegment(pathEnd[0]) ? pathEnd[0]._key : null
    return language === translateFromLanguageId
      ? translateToLanguageIds.map((translateToId) => ({
          id: translateToId,
          outputPath: [...member.path.slice(0, -1), {_key: translateToId}],
        }))
      : undefined
  }

  if (enclosingType.jsonType === 'object' && enclosingType.name.startsWith('locale')) {
    return translateFromLanguageId === member.name
      ? translateToLanguageIds.map((translateToId) => ({
          id: translateToId,
          outputPath: [...member.path.slice(0, -1), translateToId],
        }))
      : undefined
  }

  return undefined
}

export function getFieldLanguageMap(
  documentSchema: ObjectSchemaType,
  documentMembers: DocumentMember[],
  translateFromLanguageId: string,
  outputLanguageIds: string[],
  langFn: TranslationOutputsFunction,
): FieldLanguageMap[] {
  const translationMaps: FieldLanguageMap[] = []
  for (const member of documentMembers) {
    const parentPath = member.path.slice(0, -1)
    const enclosingType =
      documentMembers.find((m) => pathToString(m.path) === pathToString(parentPath))?.schemaType ??
      documentSchema

    const isV5InternationalizedArrayItem =
      member.schemaType.jsonType === 'object' &&
      member.schemaType.name.startsWith('internationalizedArray') &&
      isInternationalizedArrayItemValue(member.value) &&
      member.value.language !== undefined

    const translations = langFn(
      member,
      enclosingType,
      translateFromLanguageId,
      outputLanguageIds,
    )?.filter(
      (translation) =>
        translation.id !== translateFromLanguageId &&
        !writesStaticallyIgnoredField(documentSchema, translation.outputPath),
    )

    if (translations?.length) {
      translationMaps.push({
        inputLanguageId: translateFromLanguageId,
        inputPath: member.path,
        outputs: translations,
        ...(isV5InternationalizedArrayItem ? {relativeLanguagePath: ['language']} : {}),
      })
    }
  }

  return translationMaps
}

/**
 * Translate fields sends explicit output paths. Literal `readOnly` / `hidden`
 * fields (and anything nested under them) must not be targets — the same fields
 * Assist otherwise skips. Conditional functions are left alone; their runtime
 * state is sent separately as conditional members.
 *
 * `options.aiAssist.exclude` is included because those fields are removed from
 * the serialized schema, and requesting them makes the translate task fail.
 */
function isStaticallyIgnored(schemaType: SchemaType): boolean {
  return (
    schemaType.readOnly === true || schemaType.hidden === true || !isSchemaAssistEnabled(schemaType)
  )
}

function writesStaticallyIgnoredField(rootSchema: ObjectSchemaType, outputPath: Path): boolean {
  if (isStaticallyIgnored(rootSchema)) return true

  let current: SchemaType = rootSchema
  for (const segment of outputPath) {
    if (
      entersArrayItem(segment) &&
      isArraySchemaType(current) &&
      current.of.length > 0 &&
      current.of.every((itemType) => isStaticallyIgnored(itemType))
    ) {
      return true
    }
    const next = schemaAtSegment(current, segment)
    if (!next) return false
    if (isStaticallyIgnored(next)) return true
    current = next
  }
  return false
}

function entersArrayItem(segment: PathSegment): segment is Exclude<PathSegment, string> {
  return isIndexSegment(segment) || isKeySegment(segment) || isIndexTuple(segment)
}

function schemaAtSegment(current: SchemaType, segment: PathSegment): SchemaType | undefined {
  if (typeof segment === 'string') {
    if (!isObjectSchemaType(current)) return undefined
    return current.fields.find((field) => field.name === segment)?.type
  }

  if (entersArrayItem(segment)) {
    if (!isArraySchemaType(current)) return undefined
    const objectItems = current.of.filter((itemType) => isObjectSchemaType(itemType))
    if (objectItems.length === 1) return objectItems[0]
    if (objectItems.length === 0 && current.of.length === 1) return current.of[0]
    // Several item types: the key does not say which one. Stop so a sibling
    // type's readOnly flag cannot hide a writable item.
    return undefined
  }

  const exhaustive: never = segment
  return exhaustive
}
