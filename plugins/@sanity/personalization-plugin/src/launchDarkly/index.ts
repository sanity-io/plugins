import {definePlugin, isObjectInputProps} from 'sanity'

import {fieldLevelExperiments as baseFieldLevelExperiments} from '../fieldExperiments'
import {flattenSchemaType} from '../utils/flattenSchemaType'
import {LAUNCHDARKLY_CONFIG_DEFAULT, LaunchDarklyProvider} from './components/LaunchDarklyContext'
import {LaunchDarklyFieldLevelConfig} from './types'
import {getExperiments} from './utils'

export const fieldLevelExperiments = definePlugin<LaunchDarklyFieldLevelConfig>((config) => {
  const pluginConfig = {...LAUNCHDARKLY_CONFIG_DEFAULT, ...config}
  const {fields, projectKey, tags} = pluginConfig
  return {
    name: 'sanity-growthbook-personalistaion-plugin-field-level-experiments',
    plugins: [
      baseFieldLevelExperiments({
        fields,
        experiments: (client) => getExperiments({client, projectKey, tags}),
        experimentNameOverride: 'flag',
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

          const hasExperiment = flatFieldTypeNames.some((name) => name.startsWith('flag'))

          if (!hasExperiment) {
            return props.renderDefault(props)
          }

          const providerProps = {
            ...props,
            launchDarklyFieldPluginConfig: {
              ...pluginConfig,
            },
          }
          return LaunchDarklyProvider(providerProps)
        },
      },
    },
  }
})
