import {Flex, Spinner} from '@sanity/ui'
import {lazy, Suspense} from 'react'
import type {Tool} from 'sanity'

import {MuxApiHostProvider} from '../context/MuxApiHostContext'
import type {PluginConfig} from '../util/types'
import ToolIcon from './icons/ToolIcon'

// It imports `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`, which must stay
// out of what the studio shell loads.
const VideosBrowser = lazy(() => import('./VideosBrowser'))

const StudioTool: React.FC<PluginConfig> = (config) => {
  return (
    <MuxApiHostProvider muxApiHost={config.muxApiHost}>
      <Suspense
        fallback={
          <Flex align="center" justify="center" height="fill">
            <Spinner />
          </Flex>
        }
      >
        <VideosBrowser config={config} />
      </Suspense>
    </MuxApiHostProvider>
  )
}

export const DEFAULT_TOOL_CONFIG = {
  icon: ToolIcon,
  title: 'Videos',
}

export default function createStudioTool(config: PluginConfig): Tool {
  const toolConfig = typeof config.tool === 'object' ? config.tool : DEFAULT_TOOL_CONFIG
  return {
    name: 'mux',
    icon: toolConfig.icon || DEFAULT_TOOL_CONFIG.icon,
    title: toolConfig.title || DEFAULT_TOOL_CONFIG.title,
    component: (props: any) => <StudioTool {...config} {...props} />,
  }
}
