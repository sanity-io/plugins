import {createContext, useContext} from 'react'
import type {LayoutProps} from 'sanity'

import {DEFAULT_CONFIG} from '../helpers/constants'
import type {PluginConfig} from '../types'

const CrossDatasetDuplicatorContext = createContext(DEFAULT_CONFIG)

type ConfigProviderProps = LayoutProps & {pluginConfig: Required<PluginConfig>}

/**
 * Plugin config context hook from the Cross Dataset Duplicator plugin
 * @public
 */
export function useCrossDatasetDuplicatorConfig() {
  const pluginConfig = useContext(CrossDatasetDuplicatorContext)

  return pluginConfig
}

export function ConfigProvider(props: ConfigProviderProps) {
  const {pluginConfig, ...rest} = props

  return (
    <CrossDatasetDuplicatorContext.Provider value={pluginConfig}>
      {props.renderDefault(rest)}
    </CrossDatasetDuplicatorContext.Provider>
  )
}
