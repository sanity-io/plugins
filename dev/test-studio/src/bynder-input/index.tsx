import {defineType, defineField} from 'sanity'

export const bynderTest = defineType({
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
