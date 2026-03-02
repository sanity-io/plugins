import type {ReactNode} from 'react'
import {useMemo} from 'react'
import {type FieldProps, useFormValue} from 'sanity'

import {LANGUAGE_FIELD_NAME} from '../constants'
import {useInternationalizedArrayContext} from './InternationalizedArrayContext'

/**
 * Extracts the language identifier from a parent internationalized array item.
 *
 * Returns the `LANGUAGE_FIELD_NAME` value when the parent is an object whose
 * `_type` starts with `"internationalizedArray"` and has a string-valued
 * language field. Returns `undefined` otherwise (including on error).
 */
const getLanguageId = (fieldParent: unknown): string | undefined => {
  try {
    const languageId =
      typeof fieldParent === 'object' &&
      fieldParent !== null &&
      // Checks if it's an internationalized array item
      '_type' in fieldParent &&
      typeof fieldParent._type === 'string' &&
      fieldParent._type.startsWith('internationalizedArray') &&
      // Checks if the language field name is in the field and if it's a string
      LANGUAGE_FIELD_NAME in fieldParent &&
      typeof fieldParent[LANGUAGE_FIELD_NAME] === 'string'
        ? fieldParent[LANGUAGE_FIELD_NAME]
        : undefined
    return languageId
  } catch (error) {
    console.error('Error getting language id', error)
    return undefined
  }
}

/**
 * Custom field renderer for fields inside internationalized array items.
 *
 * - Hides the "Value" title label when the parent item has a valid language
 *   (one that exists in the configured languages list).
 * - Routes rendering based on the field's schema type name:
 *   - Non-internationalized types -> `renderDefault` (with title adjustment)
 *   - `reference` with a value -> `renderDefault` at level 0
 *   - `string` / `number` / `text` -> returns `children` directly for
 *     inline editing
 *   - Complex internationalized types (e.g. markdown) -> `renderDefault`
 *     at level 0
 */
export default function InternationalizedField(props: FieldProps): ReactNode {
  const {languages} = useInternationalizedArrayContext()
  // Get the array item (parent of the field) to look up the language from it
  const fieldParent = useFormValue(props.path.slice(0, -1))

  const languageId = getLanguageId(fieldParent)
  const customProps = useMemo(() => {
    const hasValidLanguageId = languageId ? languages.some((l) => l.id === languageId) : false
    // hide titles for 'value' fields within valid language entries
    const shouldHideTitle = props.title?.toLowerCase() === 'value' && hasValidLanguageId

    return {
      ...props,
      title: shouldHideTitle ? '' : props.title,
    }
  }, [props, languages, languageId])

  if (!customProps.schemaType.name.startsWith('internationalizedArray')) {
    return customProps.renderDefault(customProps)
  }

  // Show reference field selector if there's a value
  if (customProps.schemaType.name === 'reference' && customProps.value) {
    return customProps.renderDefault({
      ...customProps,
      title: '',
      level: 0, // Reset the level to avoid nested styling
    })
  }

  // For basic field types, we can use children to keep the simple input
  if (
    customProps.schemaType.name === 'string' ||
    customProps.schemaType.name === 'number' ||
    customProps.schemaType.name === 'text'
  ) {
    return customProps.children
  }

  // For complex fields (like markdown), we need to use renderDefault
  // to get all the field's functionality
  return customProps.renderDefault({
    ...customProps,
    level: 0, // Reset the level to avoid nested styling
  })
}
