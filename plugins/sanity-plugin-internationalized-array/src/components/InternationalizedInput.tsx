import type React from 'react'

import {RemoveCircleIcon} from '@sanity/icons'
import {
  Button,
  Card,
  Flex,
  Label,
  Menu,
  MenuButton,
  MenuItem,
  Spinner,
  Stack,
  Text,
  Tooltip,
} from '@sanity/ui'
import {type ReactNode, useMemo} from 'react'
import {type ObjectItemProps, useFormValue} from 'sanity'
import {set, unset} from 'sanity'

import {LANGUAGE_FIELD_NAME} from '../constants'
import {getLanguageDisplay} from '../utils/getLanguageDisplay'
import {getToneFromValidation} from './getToneFromValidation'
import {useInternationalizedArrayContext} from './InternationalizedArrayContext'

export type InternationalizedValue = {
  _type: string
  _key: string
  value: string
}

export default function InternationalizedInput(
  props: ObjectItemProps<InternationalizedValue>,
): ReactNode {
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
  const parentValue = useFormValue(props.path.slice(0, -1)) as InternationalizedValue[]

  // Extract the original onChange to avoid dependency issues
  const originalOnChange = props.inputProps.onChange

  // Create a wrapped onChange handler to intercept patches for paste operations
  const wrappedOnChange = (patches: unknown) => {
    // Ensure patches is an array before proceeding with paste logic
    // For single patch operations (like unset), pass through directly
    if (!Array.isArray(patches)) {
      // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
      return originalOnChange(patches as Parameters<typeof originalOnChange>[0])
    }

    // Check if this is a paste operation into an empty or uninitialized Portable Text field
    const valueField = props.value?.value
    const isEmptyOrUndefined =
      valueField === undefined ||
      valueField === null ||
      (Array.isArray(valueField) && valueField.length === 0)

    if (isEmptyOrUndefined) {
      // Check for insert patches that are trying to operate on a non-existent structure
      const hasProblematicInsert = patches.some((patch: {type?: string; path?: unknown[]}) => {
        // Ensure patch exists and has required properties
        if (!patch || typeof patch !== 'object') {
          return false
        }

        // Look for insert patches targeting the value field or direct array index
        if (
          patch.type === 'insert' &&
          patch.path &&
          Array.isArray(patch.path) &&
          patch.path.length > 0
        ) {
          // The path might be ['value', index] or just [index] depending on context
          const isTargetingValue = patch.path[0] === 'value' || typeof patch.path[0] === 'number'
          return isTargetingValue
        }
        return false
      })

      if (hasProblematicInsert) {
        // First, ensure the value field exists as an empty array if it doesn't
        const initPatch =
          valueField === undefined ? {type: 'setIfMissing', path: ['value'], value: []} : null

        // Transform the patches to ensure they work with the nested structure
        const fixedPatches = patches.map(
          (patch: {type?: string; path?: unknown[]; [key: string]: unknown}) => {
            // Ensure patch exists and has required properties
            if (!patch || typeof patch !== 'object') {
              return patch
            }

            if (patch.type === 'insert' && patch.path && Array.isArray(patch.path)) {
              // Ensure the path is correct for the nested structure
              const fixedPath = patch.path[0] === 'value' ? patch.path : ['value', ...patch.path]
              const fixedPatch = {...patch, path: fixedPath}
              return fixedPatch
            }
            return patch
          },
        )

        // If we need to initialize the field, include that patch first
        const allPatches = initPatch ? [initPatch, ...fixedPatches] : fixedPatches

        // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
        return originalOnChange(allPatches as Parameters<typeof originalOnChange>[0])
      }
    }

    // For all other cases, pass through unchanged
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
    return originalOnChange(patches as Parameters<typeof originalOnChange>[0])
  }

  const inlineProps = {
    ...props.inputProps,
    // This is the magic that makes inline editing work?
    members: props.inputProps.members.filter((m) => m.kind === 'field' && m.name === 'value'),
    // This just overrides the type
    // Remove this as it shouldn't be necessary?
    // oxlint-disable-next-line typescript-eslint/no-unnecessary-type-assertion
    value: props.value as InternationalizedValue,
    // Use our wrapped onChange handler
    onChange: wrappedOnChange,
  }

  const {validation, value, onChange, readOnly} = inlineProps

  // The parent array contains the languages from the plugin config
  const {languages, languageDisplay, defaultLanguages} = useInternationalizedArrayContext()

  const languageKeysInUse = useMemo(
    () => parentValue?.map((v) => v[LANGUAGE_FIELD_NAME]) ?? [],
    [parentValue],
  )
  const keyIsValid = languages?.length
    ? languages.find((l) => l.id === value[LANGUAGE_FIELD_NAME])
    : false

  // Changes the key of this item, ideally to a valid language
  const handleKeyChange = (event: React.MouseEvent<HTMLButtonElement>): void => {
    const languageId = event?.currentTarget?.value

    if (!value || !languages?.length || !languages.find((l) => l.id === languageId)) {
      return
    }

    onChange([set(languageId, [LANGUAGE_FIELD_NAME])])
  }

  // Removes this item from the array
  const handleUnset = (): void => {
    onChange(unset())
  }

  if (!languages) {
    return <Spinner />
  }

  const language = languages.find((l) => l.id === value[LANGUAGE_FIELD_NAME])
  const languageTitle: string =
    keyIsValid && language ? getLanguageDisplay(languageDisplay, language.title, language.id) : ''

  const isDefault = defaultLanguages.includes(value[LANGUAGE_FIELD_NAME])

  const removeButton = (
    <Button
      mode="bleed"
      icon={RemoveCircleIcon}
      tone="critical"
      disabled={readOnly || isDefault}
      onClick={handleUnset}
    />
  )

  return (
    <Card paddingTop={2} tone={getToneFromValidation(validation)}>
      <Stack space={2}>
        <Card tone="inherit">
          {keyIsValid ? (
            <Label muted size={1}>
              {languageTitle}
            </Label>
          ) : (
            <MenuButton
              button={<Button fontSize={1} text={`Change "${value[LANGUAGE_FIELD_NAME]}"`} />}
              id={`${value[LANGUAGE_FIELD_NAME]}-change-key`}
              menu={
                <Menu>
                  {languages.map((lang) => (
                    <MenuItem
                      disabled={languageKeysInUse.includes(lang.id)}
                      fontSize={1}
                      key={lang.id}
                      text={lang.id.toLocaleUpperCase()}
                      value={lang.id}
                      // @ts-expect-error - fix typings
                      onClick={handleKeyChange}
                    />
                  ))}
                </Menu>
              }
              popover={{portal: true}}
            />
          )}
        </Card>
        <Flex align="center" gap={2}>
          <Card flex={1} tone="inherit">
            {props.inputProps.renderInput(inlineProps)}
          </Card>

          <Card tone="inherit">
            {isDefault ? (
              <Tooltip
                content={
                  <Text muted size={1}>
                    Can&apos;t remove default language
                  </Text>
                }
                fallbackPlacements={['right', 'left']}
                placement="top"
                portal
              >
                <span>{removeButton}</span>
              </Tooltip>
            ) : (
              removeButton
            )}
          </Card>
        </Flex>
      </Stack>
    </Card>
  )
}
