import {isDocumentSchemaType, type ObjectField, type SchemaType} from 'sanity'

/**
 * Returns true when a document schema contains any field (including nested
 * object/array item fields) whose type name starts with `internationalizedArray`.
 *
 * Traversal short-circuits on first match to avoid unnecessary work.
 */
export function hasInternationalizedArrayField(schemaType: SchemaType): boolean {
  if (!isDocumentSchemaType(schemaType)) {
    return false
  }

  return hasInternationalizedArrayInFields(schemaType.fields)
}

function hasInternationalizedArrayInFields(fields: ObjectField[]): boolean {
  for (const field of fields) {
    if (field.type.name.startsWith('internationalizedArray')) {
      return true
    }

    if (field.type.jsonType === 'object' && hasInternationalizedArrayInFields(field.type.fields)) {
      return true
    }

    if (field.type.jsonType === 'array' && field.type.of.length > 0) {
      for (const item of field.type.of) {
        if (
          'name' in item &&
          typeof item.name === 'string' &&
          item.name.startsWith('internationalizedArray')
        ) {
          return true
        }

        if ('fields' in item && Array.isArray(item.fields)) {
          if (hasInternationalizedArrayInFields(item.fields)) {
            return true
          }
        }
      }
    }
  }

  return false
}
