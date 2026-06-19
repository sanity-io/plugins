import {EarthGlobeIcon} from '@sanity/icons'
// @ts-expect-error - legacy type-check issue will be lint-cleaned in a follow-up PR
import {definePlugin, Tool} from 'sanity'

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
