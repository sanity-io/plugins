import {createPresetsRegistry} from '@sanity/presets'
import {defineConfig, defineField} from 'sanity'

const {definePage} = createPresetsRegistry()

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
        fields: [
          defineField({
            name: 'campaign',
            title: 'Campaign',
            type: 'string',
            options: {
              list: [
                {title: 'Spring', value: 'spring'},
                {title: 'Summer', value: 'summer'},
                {title: 'Autumn', value: 'autumn'},
                {title: 'Winter', value: 'winter'},
              ],
            },
          }),
        ],
        map: {
          preview: (preview) => ({
            ...preview,
            select: {title: 'name', subtitle: 'campaign'},
          }),
        },
      }),
    ],
  },
})
