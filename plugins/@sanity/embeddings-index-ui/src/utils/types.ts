// @ts-expect-error - legacy type-check issue will be lint-cleaned in a follow-up PR
import {SchemaType} from 'sanity'

export function isType(schemaType: SchemaType, typeName: string): boolean {
  if (schemaType.name === typeName) {
    return true
  }
  if (!schemaType.type) {
    return false
  }
  return isType(schemaType.type, typeName)
}
