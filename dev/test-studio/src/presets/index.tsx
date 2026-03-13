import {linkField, LINK_FIELD_TYPE, presetsComposer} from '@sanity/presets'
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
      type: LINK_FIELD_TYPE,
    },
  ],
})

export const presetsWorkspace = definePlugin(() => ({
  schema: {types: [corePresetsTest]},
  plugins: [presetsComposer([linkField({internalTypes: ['corePresetsTest']})])],
}))
