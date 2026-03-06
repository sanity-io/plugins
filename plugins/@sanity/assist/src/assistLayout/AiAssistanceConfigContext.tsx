import {createContext, useContext} from 'react'

import type {FieldRef} from '../assistInspector/helpers'
import type {AssistPluginConfig} from '../plugin'
import type {SerializedSchemaType} from '../types'
import type {InstructStatus} from '../useApiClient'

export interface AiAssistanceConfigContextValue {
  config: AssistPluginConfig
  status?: InstructStatus
  statusLoading: boolean
  initLoading: boolean
  init: () => void
  error?: Error
  serializedTypes: SerializedSchemaType[]
  getFieldRefs: (documentType: string) => FieldRef[]
  getFieldRefsByTypePath: (documentType: string) => Record<string, FieldRef | undefined>
}

// oxlint-disable-next-line no-unsafe-type-assertion
export const AiAssistanceConfigContext = createContext<AiAssistanceConfigContextValue>({} as any)

export function useAiAssistanceConfig() {
  const context = useContext(AiAssistanceConfigContext)
  if (!context) {
    throw new Error('Missing AiAssistanceConfigContext')
  }
  return context
}

export function useSerializedTypes() {
  return useAiAssistanceConfig().serializedTypes
}
