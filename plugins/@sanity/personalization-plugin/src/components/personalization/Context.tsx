import equal from 'fast-deep-equal'
import {createContext, useContext, useMemo} from 'react'
import {type ObjectInputProps, useClient, useWorkspace} from 'sanity'
import {suspend} from 'suspend-react'

import type {PersonalizationContextProps, PersonalizationFieldPluginConfig} from '../../types'

// This provider makes the plugin config available to all components in the document form
// But with segments resolved

export const CONFIG_DEFAULT = {
  fields: [],
  apiVersion: '2024-11-07',
  personalizationNameOverride: 'personalization',
  segmentNameOverride: 'segment',
  segmentId: 'segmentId',
  segmentArrayName: 'segments',
}

const PersonalizationContext = createContext<PersonalizationContextProps>({
  ...CONFIG_DEFAULT,
  segments: [],
})

export function usePersonalizationContext() {
  return useContext(PersonalizationContext)
}

type PersonalizationProps = ObjectInputProps & {
  personalizationFieldPluginConfig: Required<PersonalizationFieldPluginConfig>
}

export function PersonalizationProvider(props: PersonalizationProps) {
  const {personalizationFieldPluginConfig} = props

  const client = useClient({apiVersion: personalizationFieldPluginConfig.apiVersion})
  const workspace = useWorkspace()

  // Fetch or return segments
  const segments = Array.isArray(personalizationFieldPluginConfig.segments)
    ? personalizationFieldPluginConfig.segments
    : suspend(
        async () => {
          if (typeof personalizationFieldPluginConfig.segments === 'function') {
            return personalizationFieldPluginConfig.segments(client)
          }
          return personalizationFieldPluginConfig.segments
        },
        [workspace],
        {equal},
      )

  const context = useMemo(
    () => ({...personalizationFieldPluginConfig, segments}),
    [personalizationFieldPluginConfig, segments],
  )

  return (
    <PersonalizationContext.Provider value={context}>
      {props.renderDefault(props)}
    </PersonalizationContext.Provider>
  )
}
