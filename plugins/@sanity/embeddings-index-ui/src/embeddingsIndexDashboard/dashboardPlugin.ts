import {EarthGlobeIcon} from '@sanity/icons'
import {definePlugin, Tool} from 'sanity'

import {EmbeddingsIndexTool} from './EmbeddingsIndexTool'

export const embeddingsIndexTool: Tool = {
  name: 'embeddings-index',
  title: 'Embeddings',
  icon: EarthGlobeIcon,
  component: EmbeddingsIndexTool,
}

export const embeddingsIndexDashboard = definePlugin({
  name: '@sanity/embeddings-index-dashboard',
  tools: [embeddingsIndexTool],
})
