import {createPresetsRegistry} from '@sanity/presets'
import {defineConfig, defineField, defineType} from 'sanity'

const {defineImage} = createPresetsRegistry()

export default defineConfig({
  name: 'default',
  title: 'Editorial',
  projectId: 'xxxxxxxx',
  dataset: 'production',
  schema: {
    types: [
      defineType({
        name: 'article',
        title: 'Article',
        type: 'document',
        fields: [
          defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
          }),
          defineImage({
            name: 'coverImage',
            title: 'Cover image',
            altText: true,
            caption: true,
            hotspot: true,
          }),
        ],
      }),
    ],
  },
})
