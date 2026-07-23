import {createPresetsRegistry} from '@sanity/presets'
import {defineConfig, defineField, defineType} from 'sanity'

const {defineLink} = createPresetsRegistry({
  link: {
    to: ['page', 'post'],
  },
})

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
        fields: [defineField({name: 'title', title: 'Title', type: 'string'})],
      }),
      defineType({
        name: 'post',
        title: 'Post',
        type: 'document',
        fields: [defineField({name: 'title', title: 'Title', type: 'string'})],
      }),
      defineType({
        name: 'menuItem',
        title: 'Menu Item',
        type: 'document',
        fields: [
          defineField({
            name: 'label',
            title: 'Label',
            type: 'string',
          }),
          defineLink({name: 'link', title: 'Link'}),
        ],
      }),
    ],
  },
})
