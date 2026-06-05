import {
  orderableDocumentListDeskItem,
  type OrderableListConfig,
  orderRankField,
  orderRankOrdering,
} from '@sanity/orderable-document-list'
import {definePlugin, defineType, type ConfigContext} from 'sanity'
import {structureTool, type StructureBuilder} from 'sanity/structure'

type StructureListItem = Parameters<ReturnType<StructureBuilder['list']>['items']>[0][number]

function orderableDeskItem(
  config: Pick<OrderableListConfig, 'type' | 'title'>,
  S: StructureBuilder,
  context: ConfigContext,
): StructureListItem {
  /* oxlint-disable no-unsafe-type-assertion -- workspace packages can resolve duplicate sanity instances under pnpm */
  return orderableDocumentListDeskItem({
    ...config,
    S: S as unknown as OrderableListConfig['S'],
    context: context as unknown as OrderableListConfig['context'],
  }) as unknown as StructureListItem
  /* oxlint-enable no-unsafe-type-assertion */
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

export const orderableDocumentListExampleStructure = definePlugin(() => ({
  plugins: [
    structureTool({
      structure: (S, context) => {
        return S.list()
          .title('Content')
          .items([
            orderableDeskItem({type: 'orderableCategory', title: 'Categories'}, S, context),
            orderableDeskItem({type: 'orderableProject', title: 'Projects'}, S, context),
          ])
      },
    }),
  ],
}))
