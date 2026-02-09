import {get} from 'lodash-es'

/**
 * Extracts a subset of values from a Sanity document based on a `select`
 * mapping (as configured in the plugin's `select` option).
 *
 * Each key in `select` becomes a key in the returned object, with its value
 * resolved from the document using the corresponding dot-path (via lodash `get`).
 *
 * Array values are filtered to remove incomplete references (objects with
 * `_type: 'reference'` but no `_ref`), since those represent empty reference
 * fields that should be ignored.
 *
 * Returns an empty object when either `select` or `document` is undefined.
 */
export const getSelectedValue = (
  select: Record<string, string> | undefined,
  document:
    | {
        [x: string]: unknown
      }
    | undefined,
): Record<string, unknown> => {
  if (!select || !document) {
    return {}
  }

  const selection: Record<string, string> = select || {}
  const selectedValue: Record<string, unknown> = {}
  for (const [key, path] of Object.entries(selection)) {
    let value = get(document, path)
    if (Array.isArray(value)) {
      // If there are references in the array, ensure they have `_ref` set, otherwise they are considered empty and can safely be ignored
      value = value.filter((item) =>
        typeof item === 'object' ? item?._type === 'reference' && '_ref' in item : true,
      )
    }
    selectedValue[key] = value
  }

  return selectedValue
}
