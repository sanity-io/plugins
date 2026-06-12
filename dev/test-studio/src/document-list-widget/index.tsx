import {dashboardTool} from '@sanity/dashboard'
import {definePlugin, defineType} from 'sanity'
import {documentListWidget} from 'sanity-plugin-dashboard-widget-document-list'

const documentListDemo = defineType({
  type: 'document',
  name: 'documentListDemo',
  title: 'Document List Demo',
  fields: [{type: 'string', name: 'title', title: 'Title'}],
})

export const documentListWidgetExample = definePlugin(() => ({
  schema: {types: [documentListDemo]},
  plugins: [
    dashboardTool({
      name: 'document-list-widget',
      title: 'Document List',
      widgets: [
        documentListWidget({
          title: 'Last created demo documents',
          types: ['documentListDemo'],
          createButtonText: 'Create new demo document',
          layout: {width: 'medium'},
        }),
        documentListWidget({
          title: 'Last edited',
          order: '_updatedAt desc',
          types: ['documentListDemo'],
          showCreateButton: false,
          layout: {width: 'medium'},
        }),
      ],
    }),
  ],
}))
