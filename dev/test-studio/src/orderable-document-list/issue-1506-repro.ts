import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'
import {defineField, defineType} from 'sanity'

/**
 * Document types used to regression-test
 * https://github.com/sanity-io/plugins/issues/1506
 *
 * With a regular document list alongside an orderable list at the same structure
 * level, creating a Page must not be routed into the Team Members orderable list.
 * See `issue1506ReproList` in `./index.tsx`.
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
