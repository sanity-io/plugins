import {DocumentTextIcon} from '@sanity/icons'
import {Box, Card, Code, Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'
import type {SanityDocument} from 'sanity'
import {definePlugin, defineType, useSchema} from 'sanity'
import {
  structureTool,
  type DefaultDocumentNodeResolver,
  type UserViewComponent,
} from 'sanity/structure'

import {serializeDocumentToHtml} from './serializeDocumentToHtml'

const naiveHtmlSerializerArticle = defineType({
  name: 'naiveHtmlSerializerArticle',
  type: 'document',
  title: 'HTML Serializer Article',
  icon: DocumentTextIcon,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'snippet',
      title: 'Snippet',
      type: 'text',
    },
    {
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [{type: 'block'}],
    },
  ],
})

const HtmlSerializeView: UserViewComponent = ({document}) => {
  const schema = useSchema()
  const doc = document.displayed

  const serialized = useMemo(() => {
    if (!doc?._id || !doc._type) return null
    // oxlint-disable-next-line no-unsafe-type-assertion -- document views receive partial drafts until saved
    return serializeDocumentToHtml(schema, doc as SanityDocument)
  }, [schema, doc])

  if (!serialized) {
    return (
      <Card padding={4}>
        <Text>Save the document to preview serialized HTML.</Text>
      </Card>
    )
  }

  return (
    <Box padding={4}>
      <Stack gap={4}>
        <Text size={1} weight="semibold">
          Serialized HTML
        </Text>
        <Card padding={3} border tone="transparent">
          <Code language="html" size={1}>
            {serialized.content}
          </Code>
        </Card>
      </Stack>
    </Box>
  )
}

const defaultDocumentNode: DefaultDocumentNodeResolver = (S, {schemaType}) => {
  if (schemaType === 'naiveHtmlSerializerArticle') {
    return S.document().views([
      S.view.form(),
      S.view.component(HtmlSerializeView).title('HTML Preview'),
    ])
  }

  return S.document().views([S.view.form()])
}

export const sanityNaiveHtmlSerializerExample = definePlugin(() => ({
  name: 'sanity-naive-html-serializer-example',
  schema: {types: [naiveHtmlSerializerArticle]},
  plugins: [
    structureTool({
      defaultDocumentNode,
    }),
  ],
}))
