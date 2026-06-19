import {isDocumentSchemaType, type ObjectField, type Path, type SchemaType} from 'sanity'

import type {ObjectFieldWithPath} from '../types'

/**
 * Flattens a document's schema type into a flat array of fields and includes their path
 */
export function flattenSchemaType(schemaType: SchemaType): ObjectFieldWithPath[] {
  if (!isDocumentSchemaType(schemaType)) {
    console.error(`Schema type is not a document`)
    return []
  }

  return extractInnerFields(schemaType.fields, [], 5)
}

function extractInnerFields(
  fields: ObjectField[],
  path: Path,
  maxDepth: number,
): ObjectFieldWithPath[] {
  if (path.length >= maxDepth) {
    return []
  }

  const result: ObjectFieldWithPath[] = []

  for (const field of fields) {
    result.push({path: [...path, field.name], ...field})

    if (field.type.jsonType === 'object') {
      result.push(...extractInnerFields(field.type.fields, [...path, field.name], maxDepth))
    } else if (field.type.jsonType === 'array') {
      // Handle array types by checking each possible type in the array
      const arrayTypes = field.type.of || []
      for (const arrayType of arrayTypes) {
        if ('fields' in arrayType) {
          result.push(...extractInnerFields(arrayType.fields, [...path, field.name], maxDepth))
        }
      }
    }
  }

  return result
}
