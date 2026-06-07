import {SanityDocument} from 'sanity'

const META_FIELDS = ['_key', '_type', '_id']

/*
 * Reduces an object like {en: 'eng text', es: 'spanish text', _key, _type}
 * to {en: 'eng text', _key, _type}
 * (for any base language, not just english)
 */
const filterToLangField = (childObj: Record<string, any>, baseLang: string) => {
  const filteredObj: Record<string, any> = {}
  filteredObj[baseLang] = childObj[baseLang]
  META_FIELDS.forEach((field) => {
    if (childObj[field]) {
      filteredObj[field] = childObj[field]
    }
  })
  return filteredObj
}

/*
 * Recursive function. Descends down the tree of objects
 * and arrays to create simplified objects that only
 * contain the base language.
 */
const findBaseLang = (childObj: Record<string, any>, baseLang: string): Record<string, any> => {
  const filteredObj: Record<string, any> = {}
  META_FIELDS.forEach((field) => {
    if (childObj[field]) {
      filteredObj[field] = childObj[field]
    }
  })

  for (const key in childObj) {
    if (childObj[key]) {
      const value: any = childObj[key]
      if (value.hasOwnProperty(baseLang)) {
        //we've reached a base language field, add it to
        //what we want to send to translation
        filteredObj[key] = filterToLangField(value, baseLang)
      }
      //we have an array that may have language fields in its objects
      else if (Array.isArray(value) && value.length && typeof value[0] === 'object') {
        const validArr: Record<string, any> = []
        //recursively find and filter for any objects that have the base language
        value.forEach((objInArray) => {
          if (objInArray._type === 'block') {
            validArr.push(objInArray)
          } else if (objInArray.hasOwnProperty(baseLang)) {
            validArr.push(filterToLangField(objInArray, baseLang))
          } else {
            const filtered = findBaseLang(objInArray, baseLang)
            const nonMetaFields = Object.keys(filtered).filter(
              (objInArrayKey) => !META_FIELDS.includes(objInArrayKey)
            )
            if (nonMetaFields.length) {
              validArr.push(filtered)
            }
          }
        })
        if (validArr.length) {
          filteredObj[key] = validArr
        }
      }
      //we have an object nested in an object
      //recurse down the tree
      else if (typeof value === 'object') {
        const nestedLangObj = findBaseLang(value, baseLang)
        const nonMetaFields = Object.keys(nestedLangObj).filter(
          (nestedObjKey) => META_FIELDS.indexOf(nestedObjKey) === -1
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
export const languageObjectFieldFilter = (
  document: SanityDocument,
  baseLang: string
): Record<string, any> => {
  //send top level object into recursive function
  return findBaseLang(document, baseLang)
}
