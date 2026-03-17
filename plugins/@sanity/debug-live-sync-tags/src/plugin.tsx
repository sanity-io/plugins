import {lazy} from 'react'
import {definePlugin, type Plugin} from 'sanity'

const ToolComponent = lazy(() => import('./components/Tool'))

interface PluginConfig {
  name?: string
  title?: string
  icon?: React.ComponentType
}

export const debugLiveSyncTags: Plugin<PluginConfig | void> = definePlugin((config) => {
  const {
    name = 'debug-live-sync-tags',
    title = 'Debug Live Sync Tags',
    icon,
    ...options
  } = config || {}

  return {
    name: '@sanity/debug-live-sync-tags',
    tools: [
      {
        name,
        title,
        icon,
        component: ToolComponent,
        options,
      },
    ],
  }
})
