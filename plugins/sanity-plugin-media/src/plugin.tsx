import {ImageIcon} from '@sanity/icons'
import {type AssetSource, type Tool as SanityTool, definePlugin} from 'sanity'

import FormBuilderTool from './components/FormBuilderTool'
import Tool from './components/Tool'
import {ToolOptionsProvider} from './contexts/ToolOptionsContext'
import mediaTag from './schemas/tag'
import type {MediaToolOptions} from './types'

const plugin = {
  icon: ImageIcon,
  name: 'media',
  title: 'Media',
}

export const mediaAssetSource = {
  ...plugin,
  component: FormBuilderTool,
} satisfies AssetSource

const tool = {
  ...plugin,
  component: Tool,
  __internalApplicationType: 'sanity/media',
} satisfies SanityTool

export const media = definePlugin<MediaToolOptions | void>((options) => ({
  name: 'media',
  studio: {
    components: {
      layout: (props) => (
        <ToolOptionsProvider options={options}>{props.renderDefault(props)}</ToolOptionsProvider>
      ),
    },
  },
  form: {
    file: {
      assetSources: (prev) => {
        return [...prev, mediaAssetSource]
      },
    },
    image: {
      assetSources: (prev) => {
        return [...prev, mediaAssetSource]
      },
    },
  },
  schema: {
    types: [mediaTag],
  },
  tools: (prev) => {
    return [...prev, tool]
  },
}))
