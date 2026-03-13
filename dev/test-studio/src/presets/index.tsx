import {presetsComposer} from '@sanity/presets'
import {definePlugin, defineType} from 'sanity'

const corePresetsTest = defineType({
  name: 'corePresetsTest',
  type: 'document',
  title: 'Core Presets Test',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
  ],
})

export const presetsWorkspace = definePlugin(() => ({
  schema: {types: [corePresetsTest]},
  plugins: [presetsComposer()],
}))
