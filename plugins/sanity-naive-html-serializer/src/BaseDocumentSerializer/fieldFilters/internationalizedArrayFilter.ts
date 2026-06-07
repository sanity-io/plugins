import {SanityDocument, TypedObject} from 'sanity'

const META_FIELDS = ['_key', '_type', '_id']

const isValidInternationalizedArray = (arr: any[], baseLang: string): boolean => {
  const internationalizedRegex = /^internationalizedArray/
  return (
    arr.length > 0 &&
    typeof arr[0] === 'object' &&
    internationalizedRegex.test(arr[0]._type) &&
    arr.filter((obj) => obj._key === baseLang).length > 0
  )
}

const filterToBaseLang = (arr: TypedObject[], baseLang: string) => {
  return arr.filter((obj) => obj._key === baseLang)
}

/*
 * Reduces an array like [
 * {_key: 'en', _type: 'internationalizedArrayStringValue', value: 'eng text'},
 * {_key: 'es', _type: 'internationalizedArrayStringValue', value: 'spanish text'}
 * ]
 * to [{value: 'eng text', _key, _type}]
 * (for any base language, not just english)
 * Works recursively, in case there are nested arrays.
 */
const findArraysWithBaseLang = (
  childObj: Record<string, any>,
  baseLang: string
): Record<string, any> => {
  const filteredObj: Record<string, any> = {}
  META_FIELDS.forEach((field) => {
    if (childObj[field]) {
      filteredObj[field] = childObj[field]
    }
  })

  for (const key in childObj) {
    if (childObj[key]) {
      const value: any = childObj[key]
      if (Array.isArray(value) && isValidInternationalizedArray(value, baseLang)) {
        //we've reached an internationalized array, add it to
        //what we want to send to translation
        filteredObj[key] = filterToBaseLang(value, baseLang)
      }
      //we have an array that may have language arrays in its objects
      else if (Array.isArray(value) && value.length && typeof value[0] === 'object') {
        //recursively find and filter for any objects that have an internationalized array
        const validArr: Record<string, any>[] = []
        value.forEach((objInArray) => {
          //we recurse down for each object. if there's a value
          //that's not default system value it passed the filter
          const filtered = findArraysWithBaseLang(objInArray, baseLang)
          const nonMetaFields = Object.keys(filtered).filter(
            (objInArrayKey) => !META_FIELDS.includes(objInArrayKey)
          )
          if (nonMetaFields.length) {
            validArr.push(filtered)
          }
        })
        if (validArr.length) {
          filteredObj[key] = validArr
        }
      }
      //we have an object nested in an object
      //recurse down the tree
      else if (typeof value === 'object') {
        const nestedLangObj = findArraysWithBaseLang(value, baseLang)
        const nonMetaFields = Object.keys(nestedLangObj).filter(
          (nestedObjKey) => !META_FIELDS.includes(nestedObjKey)
        )
        if (nonMetaFields.length) {
          filteredObj[key] = nestedLangObj
        }
      }
    }
  }
  return filteredObj
}

/*
 * Helper. If field-level translation pattern used, only sends over
 * content from the base language. Works recursively, so if users
 * use this pattern several layers deep, base language fields will still be found.
 */
export const internationalizedArrayFilter = (
  document: SanityDocument,
  baseLang: string
): Record<string, any> => {
  //send top level object into recursive function
  return findArraysWithBaseLang(document, baseLang)
}
