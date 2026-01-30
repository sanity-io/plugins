import type {SchemaType} from 'sanity'

import type {ArrayFieldOptions} from '../schema/array'

export function getLanguagesFieldOption(
  schemaType: SchemaType | undefined,
): ArrayFieldOptions['languages'] | undefined {
  if (!schemaType) {
    return undefined
  }
  // oxlint-disable-next-line no-unsafe-type-assertion
  const languagesOption = (schemaType.options as ArrayFieldOptions)?.languages
  if (languagesOption) {
    return languagesOption
  }
  return getLanguagesFieldOption(schemaType.type)
}
