import {definePlugin, defineType, defineField} from 'sanity'
import {bynderInputPlugin} from 'sanity-plugin-bynder-input'

const bynderTest = defineType({
  type: 'document',
  name: 'bynderTest',
  title: 'Bynder',
  fields: [
    {
      title: 'Title',
      name: 'Title',
      type: 'string',
    },
    defineField({
      type: 'bynder.asset',
      name: 'image1',
      options: {
        assetTypes: ['image'],
      },
    }),
    defineField({
      type: 'bynder.asset',
      name: 'image2',
      options: {
        assetTypes: ['video', 'audio'],
      },
    }),
  ],
})

export const bynderExample = definePlugin(() => ({
  schema: {types: [bynderTest]},
  plugins: [
    bynderInputPlugin({
      portalConfig: {url: 'https://wave-trial.getbynder.com/'},
      compactViewOptions: {language: 'en_US'},
    }),
  ],
}))
