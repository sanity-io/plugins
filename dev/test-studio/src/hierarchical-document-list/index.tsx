import {hierarchicalDocumentList} from '@sanity/hierarchical-document-list'
import {definePlugin} from 'sanity'

export const hierarchicalDocumentListExample = definePlugin(() => ({
  plugins: [hierarchicalDocumentList()],
}))
