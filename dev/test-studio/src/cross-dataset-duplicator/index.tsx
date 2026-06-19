import {crossDatasetDuplicator} from '@sanity/cross-dataset-duplicator'
import {LaunchIcon} from '@sanity/icons'
import {definePlugin, defineType} from 'sanity'

const crossDatasetDuplicatorArticle = defineType({
  name: 'crossDatasetDuplicatorArticle',
  type: 'document',
  title: 'Cross Dataset Duplicator Article',
  icon: LaunchIcon,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
    },
    {
      name: 'references',
      title: 'References',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'crossDatasetDuplicatorArticle'}],
        },
      ],
    },
  ],
})

export const crossDatasetDuplicatorExample = definePlugin(() => ({
  name: 'cross-dataset-duplicator-example',
  schema: {types: [crossDatasetDuplicatorArticle]},
  plugins: [
    crossDatasetDuplicator({
      tool: true,
      types: ['crossDatasetDuplicatorArticle'],
      follow: ['outbound'],
    }),
  ],
}))
