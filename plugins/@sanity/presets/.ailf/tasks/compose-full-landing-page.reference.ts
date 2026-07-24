import {createPresetsRegistry} from '@sanity/presets'
import {defineConfig, defineField, defineType} from 'sanity'

const {definePage, defineCta, defineRichText, defineImage} = createPresetsRegistry({
  link: {
    to: ['page', 'post'],
  },
})

const hero = defineType({
  name: 'hero',
  title: 'Hero',
  type: 'object',
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
    }),
    defineCta({name: 'cta', title: 'Call to action'}),
  ],
})

export default defineConfig({
  name: 'default',
  title: 'Marketing site',
  projectId: 'xxxxxxxx',
  dataset: 'production',
  schema: {
    types: [
      definePage({
        name: 'page',
        title: 'Page',
        pageBuilderBlocks: [
          'hero',
          defineRichText({name: 'richText', title: 'Rich text'}),
          defineImage({name: 'imageBlock', title: 'Image'}),
        ],
      }),
      hero,
      defineType({
        name: 'post',
        title: 'Post',
        type: 'document',
        fields: [defineField({name: 'title', title: 'Title', type: 'string'})],
      }),
    ],
  },
})
