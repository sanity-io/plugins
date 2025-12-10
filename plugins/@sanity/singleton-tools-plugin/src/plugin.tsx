import {definePlugin, type Plugin} from 'sanity'
import {lazy} from 'react'

const ToolComponent = lazy(() => import('./components/Tool'))

interface PluginConfig {
  name?: string
  title?: string
  icon?: React.ComponentType
}

export const singletonTools: Plugin<PluginConfig | void> = definePlugin(
  (config = {}) => {
    const {
      name = 'singleton-tools',
      title = 'Singleton Tools',
      icon,
      ...options
    } = config

    return {
      name: '@sanity/singleton-tools-plugin',
      tools: [
        {
          name,
          title,
          icon,
          component: ToolComponent,
          options,
        }
      ],
    }
  },
)
