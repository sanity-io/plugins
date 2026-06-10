import {SanityDocument, TypedObject} from 'sanity'

const META_FIELDS = ['_key', '_type', '_id']

/*
 * sanity-plugin-internationalized-array v4 stores the language in `_key`.
 * v5+ stores it in a dedicated `language` field with a random `_key`.
 * Support both formats by preferring `language` and falling back to `_key`.
 */
const getItemLanguage = (item: Record<string, any>): string | undefined =>
  typeof item.language === 'string' ? item.language : item._key

const isValidInternationalizedArray = (arr: any[], baseLang: string): boolean => {
  const internationalizedRegex = /^internationalizedArray/
  return (
    arr.length > 0 &&
    typeof arr[0] === 'object' &&
    internationalizedRegex.test(arr[0]._type) &&
    arr.filter((obj) => getItemLanguage(obj) === baseLang).length > 0
  )
}

const filterToBaseLang = (arr: TypedObject[], baseLang: string) => {
  return arr
    .filter((obj) => getItemLanguage(obj) === baseLang)
    .map((obj) => {
      //v5 items carry a `language` field and a random `_key`. Normalize them
      //to the v4 shape (language in `_key`) before serializing so the
      //serialized file is identical for both formats and the language code
      //is never sent out as translatable text.
      const {language, ...rest} = obj
      if (typeof language === 'string') {
        return Object.assign(rest, {_key: language})
      }
      return obj
    })
}

/*
 * Reduces an array like [
 * {_key: 'en', _type: 'internationalizedArrayStringValue', value: 'eng text'},
 * {_key: 'es', _type: 'internationalizedArrayStringValue', value: 'spanish text'}
 * ]
 * or, in the v5 format, [
 * {_key: 'rl3km9', _type: 'internationalizedArrayStringValue', language: 'en', value: 'eng text'},
 * {_key: 'fjwl27', _type: 'internationalizedArrayStringValue', language: 'es', value: 'spanish text'}
 * ]
 * to [{value: 'eng text', _key, _type}]
 * (for any base language, not just english)
 * Works recursively, in case there are nested arrays.
 */
const findArraysWithBaseLang = (
  childObj: Record<string, any>,
  baseLang: string,
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
            (objInArrayKey) => !META_FIELDS.includes(objInArrayKey),
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
          (nestedObjKey) => !META_FIELDS.includes(nestedObjKey),
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
  baseLang: string,
): Record<string, any> => {
  //send top level object into recursive function
  return findArraysWithBaseLang(document, baseLang)
}
