import {createPresetsRegistry} from '@sanity/presets'
import {defineConfig} from 'sanity'

const {definePage} = createPresetsRegistry()

export default defineConfig({
  name: 'default',
  title: 'My Studio',
  projectId: 'xxxxxxxx',
  dataset: 'production',
  schema: {
    types: [
      definePage({
        name: 'page',
        title: 'Page',
      }),
    ],
  },
})
