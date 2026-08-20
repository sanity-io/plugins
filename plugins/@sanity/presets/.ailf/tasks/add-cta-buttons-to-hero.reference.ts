import {createPresetsRegistry} from '@sanity/presets'
import {defineConfig, defineField, defineType} from 'sanity'

const {defineCta} = createPresetsRegistry({
  link: {
    to: ['landingPage'],
  },
})

export default defineConfig({
  name: 'default',
  title: 'Marketing',
  projectId: 'xxxxxxxx',
  dataset: 'production',
  schema: {
    types: [
      defineType({
        name: 'landingPage',
        title: 'Landing Page',
        type: 'document',
        fields: [
          defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
          }),
          defineField({
            name: 'hero',
            title: 'Hero',
            type: 'object',
            fields: [
              defineField({
                name: 'heading',
                title: 'Heading',
                type: 'string',
              }),
              defineField({
                name: 'ctas',
                title: 'CTAs',
                type: 'array',
                of: [defineCta({name: 'heroCta', title: 'CTA'})],
              }),
            ],
          }),
        ],
      }),
    ],
  },
})
