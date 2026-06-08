import {DocumentsIcon} from '@sanity/icons'
import {definePlugin, defineType} from 'sanity'
import DocumentsPane from 'sanity-plugin-documents-pane'
import {structureTool, type DefaultDocumentNodeResolver} from 'sanity/structure'

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

const defaultDocumentNode: DefaultDocumentNodeResolver = (S, {schemaType}) => {
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

  return S.document().views([S.view.form()])
}

export const documentsPaneExample = definePlugin(() => ({
  name: 'documents-pane-example',
  schema: {types: [documentsPaneArticle]},
  plugins: [
    structureTool({
      defaultDocumentNode,
    }),
  ],
}))
