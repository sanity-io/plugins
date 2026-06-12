import {isDocumentSchemaType, type ObjectField, type Path, type SchemaType} from 'sanity'

import {ObjectFieldWithPath} from '../types'

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
  fields: ObjectField<SchemaType>[],
  path: Path,
  maxDepth: number,
): ObjectFieldWithPath[] {
  if (path.length >= maxDepth) {
    return []
  }

  return fields.reduce<ObjectFieldWithPath[]>((acc, field) => {
    const thisFieldWithPath = {path: [...path, field.name], ...field}

    if (field.type.jsonType === 'object') {
      const innerFields = extractInnerFields(field.type.fields, [...path, field.name], maxDepth)
      return [...acc, thisFieldWithPath, ...innerFields]
    } else if (field.type.jsonType === 'array') {
      // Handle array types by checking each possible type in the array
      const arrayTypes = field.type.of || []
      const innerFields = arrayTypes.reduce<ObjectFieldWithPath[]>((arrayAcc, arrayType) => {
        if ('fields' in arrayType) {
          const typeFields = extractInnerFields(arrayType.fields, [...path, field.name], maxDepth)
          return [...arrayAcc, ...typeFields]
        }
        return arrayAcc
      }, [])
      return [...acc, thisFieldWithPath, ...innerFields]
    }

    return [...acc, thisFieldWithPath]
  }, [])
}
