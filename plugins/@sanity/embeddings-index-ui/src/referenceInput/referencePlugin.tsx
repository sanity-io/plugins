import {definePlugin, isObjectInputProps, ObjectInputProps, ReferenceSchemaType} from 'sanity'

import {FeatureEnabledProvider} from '../api/isEnabled'
import {EmbeddingsIndexConfig} from '../schemas/typeDefExtensions'
import {isType} from '../utils/types'
import {SemanticSearchReferenceInput} from './SemanticSearchReferenceInput'

export const embeddingsIndexReferenceInput = definePlugin<EmbeddingsIndexConfig | void>(
  (defaultConfig) => {
    const config = typeof defaultConfig === 'object' ? defaultConfig : undefined

    return {
      name: '@sanity/embeddings-index-reference-input',
      studio: {
        components: {
          layout: (props) => {
            return <FeatureEnabledProvider>{props.renderDefault(props)}</FeatureEnabledProvider>
          },
        },
      },
      form: {
        components: {
          input: (props) => {
            const embeddingsIndexConfig = (props.schemaType as ReferenceSchemaType)?.options
              ?.embeddingsIndex
            if (
              isObjectInputProps(props) &&
              isType(props.schemaType, 'reference') &&
              (embeddingsIndexConfig === true || embeddingsIndexConfig?.indexName)
            ) {
              return (
                <SemanticSearchReferenceInput
                  {...(props as ObjectInputProps)}
                  defaultConfig={config}
                />
              )
            }
            return props.renderDefault(props)
          },
        },
      },
    }
  },
)
