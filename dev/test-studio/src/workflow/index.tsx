import {PackageIcon, DocumentIcon} from '@sanity/icons'
import {definePlugin, defineType} from 'sanity'
import {workflow} from 'sanity-plugin-workflow'

const articleType = defineType({
  type: 'document',
  icon: DocumentIcon,
  name: 'article',
  title: 'Article',
  fields: [
    {type: 'string', name: 'title', title: 'Title'},
    {type: 'array', of: [{type: 'block'}], name: 'body', title: 'Body'},
  ],
})

const productType = defineType({
  type: 'document',
  icon: PackageIcon,
  name: 'product',
  title: 'Product',
  fields: [
    {type: 'string', name: 'title', title: 'Title'},
    {type: 'number', name: 'price', title: 'Price'},
  ],
})

export const workflowExample = definePlugin(() => ({
  schema: {types: [articleType, productType]},
  plugins: [
    workflow({
      // Required, list of document type names
      schemaTypes: [articleType.name, productType.name],
      // Optional, see below
      states: [
        {
          // Required configuration
          id: 'inReview',
          title: 'In Review',
          // Optional settings:
          // Used for the color of the Document Badge
          color: 'warning',
          // Will enable document actions and drag-and-drop for only users with these Role
          roles: ['developer', 'administrator'],
          // Requires the user to be "assigned" in order to update to this State
          requireAssignment: false,
          // Defines which States a document can be moved to from this one
          transitions: ['approved'],
        },
        {
          // Required configuration
          id: 'approved',
          title: 'Approved',
          // Optional settings:
          // Used for the color of the Document Badge
          color: 'success',
          // Will enable document actions and drag-and-drop for only users with these Role
          roles: ['developer', 'administrator'],
          // Requires the user to be "assigned" in order to update to this State
          requireAssignment: false,
          // Defines which States a document can be moved to from this one
          transitions: ['inReview'],
        },
      ],
    }),
  ],
}))
