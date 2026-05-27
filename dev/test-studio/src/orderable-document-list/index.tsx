import {
  orderableDocumentListDeskItem,
  orderRankField,
  orderRankOrdering,
} from '@sanity/orderable-document-list'
import {definePlugin, defineType} from 'sanity'
import {structureTool} from 'sanity/structure'

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

const orderableProject = defineType({
  name: 'orderableProject',
  title: 'Orderable Project',
  type: 'document',
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({type: 'orderableProject'}),
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
    },
  ],
})

export const orderableDocumentListExample = definePlugin(() => ({
  schema: {types: [orderableCategory, orderableProject]},
}))

export const orderableDocumentListExampleStructure = definePlugin(() => ({
  plugins: [
    structureTool({
      structure: (S, context) => {
        const pluginContext = context as Parameters<
          typeof orderableDocumentListDeskItem
        >[0]['context']

        return S.list()
          .title('Content')
          .items([
            orderableDocumentListDeskItem({
              type: 'orderableCategory',
              title: 'Categories',
              S,
              context: pluginContext,
            }),
            orderableDocumentListDeskItem({
              type: 'orderableProject',
              title: 'Projects',
              S,
              context: pluginContext,
            }),
          ])
      },
    }),
  ],
}))
