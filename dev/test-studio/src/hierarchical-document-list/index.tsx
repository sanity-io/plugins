import {
  createDeskHierarchy,
  hierarchicalDocumentList,
  hierarchyTree,
} from '@sanity/hierarchical-document-list'
import {BookIcon, UserIcon} from '@sanity/icons'
import {definePlugin, defineType} from 'sanity'
import {structureTool} from 'sanity/structure'

const hierarchyAuthor = defineType({
  name: 'hierarchyAuthor',
  title: 'Hierarchy Author',
  type: 'document',
  icon: UserIcon,
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
    },
  ],
})

const hierarchyBook = defineType({
  name: 'hierarchyBook',
  title: 'Hierarchy Book',
  type: 'document',
  icon: BookIcon,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{type: 'hierarchyAuthor'}],
    },
  ],
})

export const hierarchicalDocumentListExample = definePlugin(() => ({
  schema: {types: [hierarchyAuthor, hierarchyBook, hierarchyTree]},
  plugins: [hierarchicalDocumentList()],
}))

export const hierarchicalDocumentListExampleStructure = definePlugin(() => ({
  plugins: [
    structureTool({
      structure: (S, context) =>
        S.list()
          .title('Content')
          .items([
            S.documentTypeListItem('hierarchyAuthor'),
            S.documentTypeListItem('hierarchyBook'),
            S.divider(),
            createDeskHierarchy({
              S,
              context,
              title: 'Main table of contents',
              documentId: 'main-table-of-contents',
              referenceTo: ['hierarchyAuthor', 'hierarchyBook'],
              maxDepth: 3,
            }),
          ]),
    }),
  ],
}))
