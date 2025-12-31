import {LinkIcon} from '@sanity/icons'
import {definePlugin, defineType, type DefaultDocumentNodeResolver} from 'sanity'
import {Iframe} from 'sanity-plugin-iframe-pane'
import {structureTool} from 'sanity/structure'

// Example document type for demonstrating the iframe pane
const iframeDocument = defineType({
  name: 'iframeExample',
  type: 'document',
  title: 'Iframe Example',
  icon: LinkIcon,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
      },
    },
  ],
})

// Example default document node that uses the Iframe component
const defaultDocumentNode: DefaultDocumentNodeResolver = (S, {schemaType}) => {
  if (schemaType === 'iframeExample') {
    return S.document().views([
      S.view.form(),
      S.view
        .component(Iframe)
        .options({
          // Example using a string URL
          url: 'https://www.sanity.io',
          showDisplayUrl: true,
          reload: {button: true},
        })
        .title('Preview'),
    ])
  }
  return S.document().views([S.view.form()])
}

export const iframePaneExample = definePlugin(() => ({
  name: 'iframe-pane-example',
  schema: {types: [iframeDocument]},
  plugins: [
    structureTool({
      defaultDocumentNode,
    }),
  ],
}))
