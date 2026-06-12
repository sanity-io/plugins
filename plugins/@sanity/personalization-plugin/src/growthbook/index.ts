import {definePlugin, isObjectInputProps} from 'sanity'

import {fieldLevelExperiments as baseFieldLevelExperiments} from '../fieldExperiments'
import {flattenSchemaType} from '../utils/flattenSchemaType'
import {GROWTHBOOK_CONFIG_DEFAULT, GrowthbookProvider} from './Components/GrowthbookContext'
import {GrowthbookExperimentFieldPluginConfig} from './types'
import {getExperiments} from './utils'

export const fieldLevelExperiments = definePlugin<GrowthbookExperimentFieldPluginConfig>(
  (config) => {
    const pluginConfig = {...GROWTHBOOK_CONFIG_DEFAULT, ...config}
    const {fields, environment, project, convertBooleans, baseUrl, tags} = pluginConfig
    return {
      name: 'sanity-growthbook-personalistaion-plugin-field-level-experiments',
      plugins: [
        baseFieldLevelExperiments({
          fields,
          experiments: (client) =>
            getExperiments({client, environment, baseUrl, project, convertBooleans, tags}),
        }),
      ],

      form: {
        components: {
          input: (props) => {
            const isRootInput = props.id === 'root' && isObjectInputProps(props)

            if (!isRootInput) {
              return props.renderDefault(props)
            }

            const flatFieldTypeNames = flattenSchemaType(props.schemaType).map(
              (field) => field.type.name,
            )

            const hasExperiment = flatFieldTypeNames.some((name) => name.startsWith('experiment'))

            if (!hasExperiment) {
              return props.renderDefault(props)
            }

            const providerProps = {
              ...props,
              growthbookFieldPluginConfig: {
                ...pluginConfig,
              },
            }
            return GrowthbookProvider(providerProps)
          },
        },
      },
    }
  },
)
