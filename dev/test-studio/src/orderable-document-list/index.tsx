import {
  orderableDocumentListDeskItem,
  type OrderableListConfig,
  orderRankField,
  orderRankOrdering,
} from '@sanity/orderable-document-list'
import {definePlugin, defineType, type ConfigContext} from 'sanity'
import type {StructureBuilder} from 'sanity/structure'

type StructureListItem = Parameters<ReturnType<StructureBuilder['list']>['items']>[0][number]

function orderableDeskItem(
  config: Pick<OrderableListConfig, 'type' | 'title'>,
  S: StructureBuilder,
  context: ConfigContext,
): StructureListItem {
  return orderableDocumentListDeskItem({...config, S, context})
}

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

// Desk items for the orderable-document-list plugin, composed into the home
// workspace's structure (rather than living in a dedicated workspace).
export function orderableDocumentListDeskItems(
  S: StructureBuilder,
  context: ConfigContext,
): StructureListItem[] {
  return [
    orderableDeskItem({type: 'orderableCategory', title: 'Categories'}, S, context),
    orderableDeskItem({type: 'orderableProject', title: 'Projects'}, S, context),
  ]
}
