import {
  orderableDocumentListDeskItem,
  type OrderableListConfig,
  orderRankField,
  orderRankOrdering,
} from '@sanity/orderable-document-list'
import {definePlugin, defineType, type ConfigContext} from 'sanity'
import {structureTool, type StructureBuilder, type StructureResolver} from 'sanity/structure'

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

// Non-orderable doc types used by the issue-1506 repro. The bug is about
// orderable lists hijacking create/edit intents for OTHER types, so we need
// a plain, creatable document type sitting alongside the orderable ones.
const issue1506Page = defineType({
  name: 'issue1506Page',
  title: 'Page (issue #1506 repro)',
  type: 'document',
  fields: [
    {name: 'title', type: 'string', title: 'Title'},
    {name: 'slug', type: 'slug', title: 'Slug', options: {source: 'title'}},
  ],
})

const issue1506Author = defineType({
  name: 'issue1506Author',
  title: 'Author (issue #1506 repro)',
  type: 'document',
  fields: [
    {name: 'name', type: 'string', title: 'Name'},
    {name: 'bio', type: 'text', title: 'Bio'},
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

/**
 * Reproduction workspace for https://github.com/sanity-io/plugins/issues/1506.
 *
 * The structure mirrors the reporter's minimal repro: a top-level orderable
 * list sitting alongside a plain, creatable document type. Without the fix,
 * clicking "Create new document" and picking `Page (issue #1506)` opens the
 * new `page` INSIDE the orderable "Team Members" list. With the fix, it
 * opens in the correct location.
 *
 * How to verify (with this workspace loaded):
 *   1. Open the `orderable-issue-1506` workspace.
 *   2. In the Structure tool, click the "Create new document" (+) button.
 *   3. Pick "Page (issue #1506 repro)" (or "Author (issue #1506 repro)").
 *   4. Bug: the new document opens under the "Team Members" orderable list.
 *      Fixed: the new document opens at the correct location (its own pane).
 */
const issue1506Structure: StructureResolver = (S, context) =>
  S.list()
    .title('Content (issue #1506 repro)')
    .items([
      // A top-level orderable list — the intent hijacker before the fix.
      orderableDeskItem({type: 'orderableCategory', title: 'Team Members'}, S, context),
      S.divider(),
      // A plain document-type list for a non-orderable type. Creating an
      // `issue1506Page` from the "Create new" menu should land here, not
      // in "Team Members".
      S.documentTypeListItem('issue1506Page').title('Pages'),
      S.documentTypeListItem('issue1506Author').title('Authors'),
    ])

export const orderableIssue1506Repro = definePlugin(() => ({
  name: 'orderable-issue-1506-repro',
  schema: {types: [issue1506Page, issue1506Author]},
  plugins: [structureTool({structure: issue1506Structure})],
}))
