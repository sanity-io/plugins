import {definePlugin, isObjectInputProps} from 'sanity'

import {InternationalizedArrayFormInput} from './components/InternationalizedArrayFormInput'
import {InternationalizedArrayLayout} from './components/InternationalizedArrayLayout'
import Preload from './components/Preload'
import {CONFIG_DEFAULT} from './constants'
import {internationalizedArrayFieldAction} from './fieldActions'
import array from './schema/array'
import object from './schema/object'
import type {PluginConfig} from './types'
import {hasInternationalizedArrayField} from './utils/hasInternationalizedArrayField'

export const internationalizedArray = definePlugin<PluginConfig>((config) => {
  const pluginConfig = {...CONFIG_DEFAULT, ...config}
  const {
    apiVersion = '2025-10-15',
    select,
    languages,
    fieldTypes,
    defaultLanguages,
    buttonLocations,
  } = pluginConfig

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
    // Optional: render "add language" buttons as field actions
    document: {
      components: {
        unstable_layout: (props) => (
          <InternationalizedArrayLayout {...props} pluginConfig={pluginConfig} />
        ),
      },
      unstable_fieldActions: buttonLocations.includes('unstable__fieldAction')
        ? (prev) => [...prev, internationalizedArrayFieldAction]
        : undefined,
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
  }
})
