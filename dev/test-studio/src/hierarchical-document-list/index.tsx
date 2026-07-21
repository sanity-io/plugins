import {
  createDeskHierarchy,
  hierarchicalDocumentList,
  hierarchyTree,
} from '@sanity/hierarchical-document-list'
import {BookIcon} from '@sanity/icons/Book'
import {UserIcon} from '@sanity/icons/User'
import {definePlugin, defineType, type ConfigContext} from 'sanity'
import type {StructureBuilder} from 'sanity/structure'

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

// Desk items for the hierarchical-document-list plugin, composed into the
// home workspace's structure (rather than living in a dedicated workspace).
export function hierarchicalDocumentListDeskItems(S: StructureBuilder, context: ConfigContext) {
  return [
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
  ]
}
