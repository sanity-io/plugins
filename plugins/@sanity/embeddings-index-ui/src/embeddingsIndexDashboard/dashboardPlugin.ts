import {EarthGlobeIcon} from '@sanity/icons/EarthGlobe'
import {definePlugin, type Tool} from 'sanity'

import {EmbeddingsIndexTool} from './EmbeddingsIndexTool'

const embeddingsIndexTool: Tool = {
  name: 'embeddings-index',
  title: 'Embeddings',
  icon: EarthGlobeIcon,
  component: EmbeddingsIndexTool,
}

export const embeddingsIndexDashboard = definePlugin({
  name: '@sanity/embeddings-index-dashboard',
  tools: [embeddingsIndexTool],
})
