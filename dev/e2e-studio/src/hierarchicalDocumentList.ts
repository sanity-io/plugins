import {
  createStructureHierarchy,
  hierarchicalDocumentList,
  hierarchyTree,
} from '@sanity/hierarchical-document-list'
import {type ConfigContext, defineField, definePlugin, defineType} from 'sanity'
import type {StructureBuilder} from 'sanity/structure'

/**
 * Schema + plugin wiring for hierarchical-document-list e2e coverage.
 * The specs seed `HIERARCHY_TREE_DOCUMENT_ID` and the books it references.
 */
const HIERARCHY_TREE_DOCUMENT_ID = 'hierarchy-e2e-tree'

const hierarchyBookType = defineType({
  name: 'hierarchyBook',
  title: 'Hierarchy Book',
  type: 'document',
  fields: [defineField({name: 'title', title: 'Title', type: 'string'})],
})

export const hierarchicalDocumentListExample = definePlugin(() => ({
  schema: {types: [hierarchyBookType, hierarchyTree]},
  plugins: [hierarchicalDocumentList()],
}))

export function hierarchicalDocumentListStructureItems(
  S: StructureBuilder,
  context: ConfigContext,
) {
  return [
    createStructureHierarchy({
      S,
      context,
      title: 'Hierarchy',
      documentId: HIERARCHY_TREE_DOCUMENT_ID,
      referenceTo: ['hierarchyBook'],
      maxDepth: 3,
    }),
  ]
}
