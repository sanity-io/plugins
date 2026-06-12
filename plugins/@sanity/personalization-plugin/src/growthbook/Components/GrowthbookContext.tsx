import {createContext, useContext, useMemo, useState} from 'react'
import {ObjectInputProps} from 'sanity'

import {GrowthbookContextProps, GrowthbookExperimentFieldPluginConfig} from '../types'
import {Secrets} from './Secrets'

export const GROWTHBOOK_CONFIG_DEFAULT = {
  baseUrl: 'https://api.growthbook.io/api/v1',
}

export const GrowthbookContext = createContext<GrowthbookContextProps>({
  setSecret: () => undefined,
  secret: undefined,
})

export function useGrowthbookContext() {
  return useContext(GrowthbookContext)
}

type GrowthbookProps = ObjectInputProps & {
  growthbookFieldPluginConfig: GrowthbookExperimentFieldPluginConfig
}

export function GrowthbookProvider(props: GrowthbookProps) {
  const {growthbookFieldPluginConfig} = props
  const [secret, setSecret] = useState<string | undefined>()

  const context = useMemo(
    () => ({...growthbookFieldPluginConfig, secret, setSecret}),
    [growthbookFieldPluginConfig, secret, setSecret],
  )

  return (
    <GrowthbookContext.Provider value={context}>
      <Secrets {...props} />
    </GrowthbookContext.Provider>
  )
}
