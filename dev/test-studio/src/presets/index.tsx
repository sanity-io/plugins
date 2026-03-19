import {linkType, LINK_TYPE_NAME, presetsComposer} from '@sanity/presets'
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
    {
      name: 'link',
      title: 'Link',
      type: LINK_TYPE_NAME,
    },
  ],
})

export const presetsWorkspace = definePlugin(() => ({
  schema: {types: [corePresetsTest]},
  plugins: [presetsComposer([linkType({internalTypes: ['corePresetsTest']})])],
}))
