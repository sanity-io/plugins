import {embeddingsIndexDashboard, embeddingsIndexReferenceInput} from '@sanity/embeddings-index-ui'
import {EarthGlobeIcon} from '@sanity/icons/EarthGlobe'
import {defineField, definePlugin, defineType} from 'sanity'

const embeddingsArticle = defineType({
  name: 'embeddingsArticle',
  title: 'Embeddings Article',
  type: 'document',
  icon: EarthGlobeIcon,
  fields: [
    defineField({name: 'title', type: 'string'}),
    defineField({
      name: 'related',
      title: 'Related article (semantic search)',
      type: 'reference',
      to: [{type: 'embeddingsArticle'}],
      options: {
        embeddingsIndex: {
          indexName: 'demo-index',
          maxResults: 8,
          searchMode: 'embeddings',
        },
      },
    }),
    defineField({
      name: 'relatedDefaultPlugin',
      title: 'Related (plugin default index)',
      type: 'reference',
      to: [{type: 'embeddingsArticle'}],
      options: {embeddingsIndex: true},
    }),
  ],
})

export const embeddingsIndexUiExample = definePlugin(() => ({
  schema: {types: [embeddingsArticle]},
  plugins: [
    embeddingsIndexDashboard(),
    embeddingsIndexReferenceInput({
      indexName: 'demo-index',
      maxResults: 10,
      searchMode: 'default',
    }),
  ],
}))
