import {Box, Stack, Text, useToast} from '@sanity/ui'
import {type ReactElement, useCallback} from 'react'
import {
  type FormInsertPatch,
  type FormSetIfMissingPatch,
  insert,
  isSanityDocument,
  PatchEvent,
  setIfMissing,
  useSchema,
} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

import {LANGUAGE_FIELD_NAME} from '../constants'
import type {DocumentsToTranslate} from '../utils/getDocumentsToTranslate'
import {getDocumentsToTranslate} from '../utils/getDocumentsToTranslate'
import AddButtons from './AddButtons'

type DocumentAddButtonsProps = {
  value: Record<string, unknown> | undefined
}
/**
 * Document-level "add translation" panel that appears outside individual
 * internationalized array fields (when `buttonLocations` includes `'document'`).
 *
 * Renders a heading and a row of per-language buttons. When a language button
 * is clicked the component:
 *
 * 1. Scans the current document for all internationalized array fields
 *    using `getDocumentsToTranslate`.
 * 2. Filters out fields that already contain a translation for the selected
 *    language, and deduplicates by field path.
 * 3. Shows an error toast if no eligible fields remain.
 * 4. Creates `setIfMissing` + `insert` patches to add the new language
 *    entry to each eligible field, dispatching them via `onChange`.
 *
 * For Portable Text and other array-based value fields, the initial value
 * is set to an empty array (`[]`) rather than `undefined`.
 */
export default function DocumentAddButtons(props: DocumentAddButtonsProps): ReactElement {
  const value = isSanityDocument(props.value) ? props.value : undefined
  const toast = useToast()
  const {onChange} = useDocumentPane()
  const schema = useSchema()

  // Helper function to determine if a field should be initialized as an array
  const getInitialValueForType = useCallback(
    (typeName: string): unknown => {
      if (!typeName) return undefined

      // Extract the base type name from internationalized array type
      // e.g., "internationalizedArrayBodyValue" -> "body"
      const match = typeName.match(/^internationalizedArray(.+)Value$/)
      if (!match || !match[1]) return undefined

      const baseTypeName = match[1].charAt(0).toLowerCase() + match[1].slice(1)

      // Check if it's a known array-based type (Portable Text fields)
      const arrayBasedTypes = new Set(['body', 'htmlContent', 'blockContent', 'portableText'])
      if (arrayBasedTypes.has(baseTypeName)) {
        return []
      }

      // Try to look up the schema type to determine if it's an array
      const schemaType = schema.get(typeName)
      if (schemaType && 'fields' in schemaType) {
        // Check if this is an object type with a 'value' field
        // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
        const fields = schemaType.fields as Array<{
          name: string
          type?: {jsonType?: string; name?: string; type?: string; of?: unknown}
        }>
        const valueField = fields.find((f) => f.name === 'value')
        if (valueField) {
          const fieldType = valueField.type
          // Check if the value field is an array type
          if (
            fieldType?.jsonType === 'array' ||
            fieldType?.name === 'array' ||
            fieldType?.type === 'array' ||
            fieldType?.of !== undefined ||
            (fieldType?.name && arrayBasedTypes.has(fieldType.name))
          ) {
            return []
          }
        }
      }

      return undefined
    },
    [schema],
  )

  const handleDocumentButtonClick = useCallback(
    async (languageId: string) => {
      const documentsToTranslation = getDocumentsToTranslate(value, [])

      const alreadyTranslated = documentsToTranslation.filter(
        (translation) => translation?.[LANGUAGE_FIELD_NAME] === languageId,
      )
      const removeDuplicates = documentsToTranslation.reduce<DocumentsToTranslate[]>(
        (filteredTranslations, translation) => {
          if (
            alreadyTranslated.filter(
              (alreadyTranslation) => alreadyTranslation.pathString === translation.pathString,
            ).length > 0
          ) {
            return filteredTranslations
          }
          const translationAlreadyExists = filteredTranslations.filter(
            (filteredTranslation) => filteredTranslation.path === translation.path,
          )

          if (translationAlreadyExists.length > 0) {
            return filteredTranslations
          }
          filteredTranslations.push(translation)
          return filteredTranslations
        },
        [],
      )
      if (removeDuplicates.length === 0) {
        toast.push({
          status: 'error',
          title: 'No internationalizedArray fields found in document root',
        })
        return
      }

      // Write a new patch for each empty field
      const patches: (FormSetIfMissingPatch | FormInsertPatch)[] = []

      for (const toTranslate of removeDuplicates) {
        const path = toTranslate.path

        // Get the appropriate initial value for this field type
        const initialValue = getInitialValueForType(toTranslate._type)

        const ifMissing = setIfMissing([], path)
        const insertValue = insert(
          [
            {
              [LANGUAGE_FIELD_NAME]: languageId,
              _type: toTranslate._type,
              value: initialValue, // Use the determined initial value instead of undefined
            },
          ],
          'after',
          [...path, -1],
        )
        patches.push(ifMissing)
        patches.push(insertValue)
      }

      onChange(PatchEvent.from(patches.flat()))
    },
    [value, getInitialValueForType, onChange, toast],
  )
  return (
    <Stack space={3}>
      <Box>
        <Text size={1} weight="semibold">
          Add translation to internationalized fields
        </Text>
      </Box>
      <AddButtons readOnly={false} handleClick={handleDocumentButtonClick} languagesInUse={[]} />
    </Stack>
  )
}
