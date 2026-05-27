import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'
import {definePlugin, defineType} from 'sanity'

const orderableCategory = defineType({
  name: 'orderableCategory',
  title: 'Orderable Category',
  type: 'document',
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({type: 'orderableCategory'}),
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
  ],
})

export const orderableDocumentListExample = definePlugin(() => ({
  schema: {types: [orderableCategory]},
}))
