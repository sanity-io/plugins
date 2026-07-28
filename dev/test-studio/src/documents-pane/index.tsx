import {DocumentsIcon} from '@sanity/icons/Documents'
import {definePlugin, defineType} from 'sanity'
import DocumentsPane from 'sanity-plugin-documents-pane'
import type {DefaultDocumentNodeResolver} from 'sanity/structure'

const documentsPaneArticle = defineType({
  name: 'documentsPaneArticle',
  type: 'document',
  title: 'Documents Pane Article',
  icon: DocumentsIcon,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'references',
      title: 'References',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'documentsPaneArticle'}],
        },
      ],
    },
  ],
})

export const documentsPaneDefaultDocumentNode: DefaultDocumentNodeResolver = (S, {schemaType}) => {
  if (schemaType === 'documentsPaneArticle') {
    return S.document().views([
      S.view.form(),
      S.view
        .component(DocumentsPane)
        .options({
          query: `*[_type == "documentsPaneArticle" && references($id)]`,
          params: {id: `_id`},
          options: {perspective: 'previewDrafts'},
          debug: true,
        })
        .title('Incoming References'),
    ])
  }

  return null
}

export const documentsPaneExample = definePlugin(() => ({
  name: 'documents-pane-example',
  schema: {types: [documentsPaneArticle]},
}))
