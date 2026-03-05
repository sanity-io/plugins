import type {ObjectSchemaType} from 'sanity'

import {
  asFieldRefsByTypePath,
  type FieldRef,
  getFieldRefs as createFieldRefs,
} from '../assistInspector/helpers'

export function createFieldRefCache() {
  const byType: Record<
    string,
    | {
        fieldRefs: FieldRef[]
        fieldRefsByTypePath: Record<string, FieldRef | undefined>
      }
    | undefined
  > = {}

  function getRefsForType(schemaType: ObjectSchemaType) {
    const documentType = schemaType.name
    const cached = byType[documentType]
    if (cached) return cached

    const fieldRefs = createFieldRefs(schemaType)
    const fieldRefsByTypePath = asFieldRefsByTypePath(fieldRefs)
    const refs = {
      fieldRefs,
      fieldRefsByTypePath,
    }
    byType[documentType] = refs
    return refs
  }

  return getRefsForType
}
