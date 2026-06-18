import equal from 'fast-deep-equal'
import {createContext, useContext, useMemo} from 'react'
import {type ObjectInputProps, useClient, useWorkspace} from 'sanity'
import {suspend} from 'suspend-react'

import type {ExperimentContextProps, ExperimentFieldPluginConfig} from '../../types'

// This provider makes the plugin config available to all components in the document form
// But with experiments resolved

export const CONFIG_DEFAULT = {
  fields: [],
  apiVersion: '2024-11-07',
  experimentNameOverride: 'experiment',
  variantNameOverride: 'variant',
  variantId: 'variantId',
  variantArrayName: 'variants',
  experimentId: 'experimentId',
}

const ExperimentContext = createContext<ExperimentContextProps>({
  ...CONFIG_DEFAULT,
  experiments: [],
})

export function useExperimentContext() {
  return useContext(ExperimentContext)
}

type ExperimentProps = ObjectInputProps & {
  experimentFieldPluginConfig: Required<ExperimentFieldPluginConfig>
}

export function ExperimentProvider(props: ExperimentProps) {
  const {experimentFieldPluginConfig} = props

  const client = useClient({apiVersion: experimentFieldPluginConfig.apiVersion})
  const workspace = useWorkspace()

  // Fetch or return experiments
  const experiments = Array.isArray(experimentFieldPluginConfig.experiments)
    ? experimentFieldPluginConfig.experiments
    : suspend(
        async () => {
          if (typeof experimentFieldPluginConfig.experiments === 'function') {
            return experimentFieldPluginConfig.experiments(client)
          }
          return experimentFieldPluginConfig.experiments
        },
        [workspace],
        {equal},
      )

  const context = useMemo(
    () => ({...experimentFieldPluginConfig, experiments}),
    [experimentFieldPluginConfig, experiments],
  )

  return (
    <ExperimentContext.Provider value={context}>
      {props.renderDefault(props)}
    </ExperimentContext.Provider>
  )
}
