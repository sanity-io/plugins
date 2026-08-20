import {EditIcon} from '@sanity/icons/Edit'
import {ImageIcon} from '@sanity/icons/Image'
import {type AssetSource, type Tool as SanityTool, definePlugin} from 'sanity'

import EditAssetTool from './components/EditAssetTool'
import FormBuilderTool from './components/FormBuilderTool'
import Tool from './components/Tool'
import {ToolOptionsProvider} from './contexts/ToolOptionsContext'
import mediaFolder from './schemas/folder'
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

const editMediaAssetSource = {
  icon: EditIcon,
  name: 'edit-media',
  // oxlint-disable-next-line no-deprecated -- `i18nKey` requires a locale bundle; a plain title is intentional here
  title: 'Edit Media',
  component: EditAssetTool,
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
        return [...prev, mediaAssetSource, editMediaAssetSource]
      },
    },
    image: {
      assetSources: (prev) => {
        return [...prev, mediaAssetSource, editMediaAssetSource]
      },
    },
  },
  schema: {
    types: [mediaTag, mediaFolder],
  },
  tools: (prev) => {
    return [...prev, tool]
  },
}))
