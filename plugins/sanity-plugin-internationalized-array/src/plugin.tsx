import {languageFilter} from '@sanity/language-filter'
import {definePlugin, isObjectInputProps} from 'sanity'

import {InternationalizedArrayFormInput} from './components/InternationalizedArrayFormInput'
import {InternationalizedArrayLayout} from './components/InternationalizedArrayLayout'
import Preload from './components/Preload'
import {CONFIG_DEFAULT} from './constants'
import array from './schema/array'
import object from './schema/object'
import type {PluginConfig} from './types'
import {hasInternationalizedArrayField} from './utils/hasInternationalizedArrayField'

/**
 * Studio v4+ resolves `document.unstable_fieldActions` in the document pane
 * (`FieldActionsResolver`), outside `FormValueProvider`. This plugin's field
 * actions call `useFormValue()`, which then throws and takes down the editor.
 * Same layout in Studio v4.0.0, v5.0.0, and v6 — not a v6-only break.
 */
export const UNSTABLE_FIELD_ACTION_WARNING =
  '[sanity-plugin-internationalized-array] `buttonLocations` includes `unstable__fieldAction`. ' +
  'That location crashes the document editor on Sanity Studio v4, v5, and v6: field actions ' +
  'resolve outside FormValueProvider, so useFormValue() throws ' +
  '"useFormValue must be used within a FormValueProvider". Use `field` and/or `document` instead.'

export const internationalizedArray = definePlugin<PluginConfig>((config) => {
  const pluginConfig = {...CONFIG_DEFAULT, ...config}
  const {
    // oxlint-disable-next-line no-useless-default-assignment
    apiVersion = '2025-10-15',
    select,
    languages,
    fieldTypes,
    defaultLanguages,
    buttonLocations,
    languageFilter: languageFilterConfig,
  } = pluginConfig

  const wantsUnstableFieldAction = buttonLocations.includes('unstable__fieldAction')
  if (wantsUnstableFieldAction) {
    console.warn(UNSTABLE_FIELD_ACTION_WARNING)
  }

  return {
    name: 'sanity-plugin-internationalized-array',
    // Preload languages for use throughout the Studio
    studio: Array.isArray(languages)
      ? undefined
      : {
          components: {
            layout: (props) => (
              <>
                <Preload apiVersion={apiVersion} languages={languages} />
                {props.renderDefault(props)}
              </>
            ),
          },
        },
    document: {
      components: {
        unstable_layout: (props) => (
          <InternationalizedArrayLayout {...props} pluginConfig={pluginConfig} />
        ),
      },
    },
    // Wrap document editor with a language provider
    form: {
      components: {
        input: (props) => {
          const isRootInput = props.id === 'root' && isObjectInputProps(props)

          if (!isRootInput) {
            return props.renderDefault(props)
          }

          const hasInternationalizedArray = hasInternationalizedArrayField(props.schemaType)

          if (
            hasInternationalizedArray &&
            pluginConfig.includeForDocumentType(props.schemaType.name)
          ) {
            return <InternationalizedArrayFormInput {...props} pluginConfig={pluginConfig} />
          }
          return props.renderDefault(props)
        },
      },
    },
    // Register custom schema types for the outer array and the inner object
    schema: {
      types: [
        ...fieldTypes.map((type) => array({type, apiVersion, select, languages, defaultLanguages})),
        ...fieldTypes.map((type) => object({type})),
      ],
    },
    plugins:
      languageFilterConfig?.documentTypes?.length > 0
        ? [
            languageFilter({
              documentTypes: languageFilterConfig.documentTypes,
              supportedLanguages: languages,
              defaultLanguages: languageFilterConfig.defaultLanguages,
              // This is specifically not adding filterField avoid the default filter field implementation.
              // It will be filtered in `internationalizedArray` component and will have access to the resolved languages.
              // Rendering the fields if the language key is incorrect, providing an improved UX
            }),
          ]
        : undefined,
  }
})
