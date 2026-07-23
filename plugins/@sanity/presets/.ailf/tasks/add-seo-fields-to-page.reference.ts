import {createPresetsRegistry} from '@sanity/presets'
import {defineConfig, defineField, defineType} from 'sanity'

const {defineSeo} = createPresetsRegistry()

export default defineConfig({
  name: 'default',
  title: 'Website',
  projectId: 'xxxxxxxx',
  dataset: 'production',
  schema: {
    types: [
      defineType({
        name: 'page',
        title: 'Page',
        type: 'document',
        fields: [
          defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
          }),
          defineField({
            name: 'body',
            title: 'Body',
            type: 'text',
          }),
          defineSeo({name: 'seo', title: 'SEO'}),
        ],
      }),
    ],
  },
})
