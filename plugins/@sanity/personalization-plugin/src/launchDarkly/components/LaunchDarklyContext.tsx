import {createContext, useContext, useMemo, useState} from 'react'
import type {ObjectInputProps} from 'sanity'

import type {LaunchDarklyContextProps, LaunchDarklyFieldLevelConfig} from '../types'
import {Secrets} from './Secrets'

export const LAUNCHDARKLY_CONFIG_DEFAULT = {}

const LaunchDarklyContext = createContext<LaunchDarklyContextProps>({
  setSecret: () => undefined,
  secret: undefined,
})

export function useLaunchDarklyContext() {
  return useContext(LaunchDarklyContext)
}

type LaunchDarklyProps = ObjectInputProps & {
  launchDarklyFieldPluginConfig: LaunchDarklyFieldLevelConfig
}

export function LaunchDarklyProvider(props: LaunchDarklyProps) {
  const {launchDarklyFieldPluginConfig} = props
  const [secret, setSecret] = useState<string | undefined>()

  const context = useMemo(
    () => ({...launchDarklyFieldPluginConfig, secret, setSecret}),
    [launchDarklyFieldPluginConfig, secret, setSecret],
  )

  return (
    <LaunchDarklyContext.Provider value={context}>
      <Secrets {...props} />
    </LaunchDarklyContext.Provider>
  )
}
