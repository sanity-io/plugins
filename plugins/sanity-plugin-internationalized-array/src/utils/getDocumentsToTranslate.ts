import type {SanityDocument} from 'sanity'

export interface DocumentsToTranslate {
  path: (string | number)[]
  pathString: string
  _key: string
  _type: string
  [key: string]: unknown
}

/**
 * Recursively traverses a Sanity document (or any nested value) and collects
 * all internationalized array items found within it.
 *
 * An item is considered an internationalized array value when its `_type`
 * starts with `"internationalizedArray"` and ends with `"Value"`.
 *
 * The function walks through objects and arrays, skipping keys that start
 * with `_` (internal Sanity fields like `_id`, `_type`, `_rev`). Each
 * returned item includes the original properties plus `path` (array of
 * segments) and `pathString` (dot-joined) indicating where it was found.
 */
export const getDocumentsToTranslate = (
  // oxlint-disable-next-line typescript-eslint/no-redundant-type-constituents
  value: SanityDocument | unknown,
  rootPath: (string | number)[] = [],
): DocumentsToTranslate[] => {
  if (Array.isArray(value)) {
    const arrayRootPath = [...rootPath]

    // if item contains internationalized return array
    const internationalizedValues = value.filter((item) => {
      if (Array.isArray(item)) return false

      if (typeof item === 'object') {
        // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
        const type = item?._type as string | undefined
        return type?.startsWith('internationalizedArray') && type?.endsWith('Value')
      }
      return false
    })

    if (internationalizedValues.length > 0) {
      return internationalizedValues.map((internationalizedValue) => {
        return Object.assign({}, internationalizedValue, {
          path: arrayRootPath,
          pathString: arrayRootPath.join('.'),
        })
      })
    }

    if (value.length > 0) {
      return value.flatMap((item, index) =>
        getDocumentsToTranslate(item, [...arrayRootPath, index]),
      )
    }

    return []
  }
  if (typeof value === 'object' && value) {
    const startsWithUnderscoreRegex = /^_/
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
    const itemKeys = Object.keys(value).filter(
      (key) => !key.match(startsWithUnderscoreRegex),
    ) as (keyof typeof value)[]

    return itemKeys.flatMap((item) => {
      const selectedValue = value[item] as unknown
      const path = [...rootPath, item]
      return getDocumentsToTranslate(selectedValue, path)
    })
  }
  return []
}
