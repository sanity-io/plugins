import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'
import {defineField, defineType} from 'sanity'

/**
 * Document types used to reproduce
 * https://github.com/sanity-io/plugins/issues/1506
 *
 * The bug: `orderableDocumentListDeskItem()` sets a `canHandleIntent` that
 * returns true for every create/edit intent regardless of `params.type`. When
 * a regular document type list sits alongside an orderable list in the same
 * structure, creating a document of the non-orderable type gets routed into
 * the orderable list instead.
 */
export const issue1506Page = defineType({
  name: 'issue1506Page',
  title: 'Issue #1506 Page',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
  ],
})

export const issue1506TeamMember = defineType({
  name: 'issue1506TeamMember',
  title: 'Issue #1506 Team Member',
  type: 'document',
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({type: 'issue1506TeamMember'}),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
    }),
  ],
})
