import {CopyIcon, DocumentTextIcon} from '@sanity/icons'
import {Box, Button, Card, Code, Flex, Stack, Text, Tooltip, useToast} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import type {SanityDocument} from 'sanity'
import {definePlugin, defineType, useSchema} from 'sanity'
import {
  structureTool,
  type DefaultDocumentNodeResolver,
  type UserViewComponent,
} from 'sanity/structure'

import {formatHtml} from './formatHtml'
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
  const {push: pushToast} = useToast()

  const serialized = useMemo(() => {
    if (!doc?._id || !doc._type) return null
    // oxlint-disable-next-line no-unsafe-type-assertion -- document views receive partial drafts until saved
    return serializeDocumentToHtml(schema, doc as SanityDocument)
  }, [schema, doc])

  const rawHtml = serialized?.content

  const formattedHtml = useMemo(() => {
    if (!rawHtml) return null
    return formatHtml(rawHtml)
  }, [rawHtml])

  const handleCopy = useCallback(async () => {
    if (!rawHtml) return

    try {
      await navigator.clipboard.writeText(rawHtml)
      pushToast({
        closable: true,
        status: 'success',
        title: 'HTML copied to clipboard',
      })
    } catch {
      pushToast({
        closable: true,
        status: 'error',
        title: 'Failed to copy HTML to clipboard',
      })
    }
  }, [pushToast, rawHtml])

  if (!serialized || !formattedHtml) {
    return (
      <Card padding={4}>
        <Text>Save the document to preview serialized HTML.</Text>
      </Card>
    )
  }

  return (
    <Box padding={4} height="fill">
      <Stack gap={4} height="fill">
        <Flex align="center" gap={3} justify="space-between">
          <Text size={1} weight="semibold">
            Serialized HTML
          </Text>
          <Tooltip
            content={
              <Text size={1} style={{whiteSpace: 'nowrap'}}>
                Copy raw HTML
              </Text>
            }
            padding={2}
            placement="left"
          >
            <Button
              aria-label="Copy HTML"
              icon={CopyIcon}
              mode="ghost"
              onClick={() => void handleCopy()}
              text="Copy"
            />
          </Tooltip>
        </Flex>
        <Card
          border
          padding={3}
          radius={2}
          style={{flex: 1, minHeight: 0, overflow: 'auto'}}
          tone="transparent"
        >
          <Code
            language="html"
            size={1}
            style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
            }}
          >
            {formattedHtml}
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
