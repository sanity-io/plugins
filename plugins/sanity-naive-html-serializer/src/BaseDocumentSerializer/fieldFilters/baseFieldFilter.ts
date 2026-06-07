import {ObjectField, TypedObject} from 'sanity'

const META_FIELDS = ['_key', '_type', '_id']

/*
 * Eliminates stop-types and non-localizable fields
 * for document-level translation.
 */
export const fieldFilter = (
  obj: Record<string, any>,
  objFields: ObjectField[],
  stopTypes: string[]
): TypedObject => {
  const filteredObj: TypedObject = {_type: obj._type}

  const fieldFilterFunc = (field: Record<string, any>) => {
    if (field.localize === false) {
      return false
    } else if (field.type === 'string' || field.type === 'text') {
      return true
    } else if (Array.isArray(obj[field.name])) {
      return true
    } else if (!stopTypes.includes(field.type)) {
      return true
    }
    return false
  }

  const validFields = [
    ...META_FIELDS,
    ...objFields?.filter(fieldFilterFunc)?.map((field) => field.name),
  ]
  validFields.forEach((field) => {
    if (obj[field]) {
      filteredObj[field] = obj[field]
    }
  })
  return filteredObj
}
