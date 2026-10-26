import {ClipboardIcon} from '@sanity/icons/Clipboard'
import {Box, Button, Card, Flex, Stack, Text, TextArea} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {useCallback, useState} from 'react'
import {type DocumentActionComponent, useDocumentOperation} from 'sanity'

import {articleFromHtml, type ArticleImport} from './articleFromHtml'

const ImportHtmlAction: DocumentActionComponent = (props) => {
  const {patch} = useDocumentOperation(props.id, props.type)
  const {push: pushToast} = useToast()
  const [open, setOpen] = useState(false)
  const [html, setHtml] = useState('')
  const [error, setError] = useState<string | null>(null)

  const close = useCallback(() => {
    setOpen(false)
    setHtml('')
    setError(null)
  }, [])

  const applyImport = useCallback(
    (fields: ArticleImport) => {
      patch.execute([{set: fields}])
      close()
      pushToast({
        closable: true,
        status: 'success',
        title: 'Imported HTML into this article',
      })
    },
    [close, patch, pushToast],
  )

  return {
    label: 'Import HTML',
    icon: ClipboardIcon,
    title: 'Paste serialized HTML and apply it to this article',
    disabled: !props.id,
    onHandle: () => {
      setOpen(true)
    },
    dialog: open && {
      type: 'dialog',
      header: 'Import translated HTML',
      width: 'large',
      onClose: close,
      content: (
        <ImportHtmlDialog
          error={error}
          html={html}
          patchDisabled={Boolean(patch.disabled)}
          onChange={(value) => {
            setHtml(value)
            setError(null)
          }}
          onImport={() => {
            const result = articleFromHtml(html)
            if (!result.ok) {
              setError(result.message)
              return
            }
            applyImport(result.fields)
          }}
        />
      ),
    },
  }
}

function ImportHtmlDialog(props: {
  html: string
  error: string | null
  patchDisabled: boolean
  onChange: (value: string) => void
  onImport: () => void
}) {
  return (
    <Box padding={4}>
      <Stack gap={4}>
        <Text muted size={1}>
          Paste the serialized HTML from HTML Preview, with whatever edits you made. Title, snippet,
          and content on this article are replaced. The document id stays the same.
        </Text>
        <TextArea
          aria-label="Serialized HTML"
          onChange={(event) => props.onChange(event.currentTarget.value)}
          placeholder="<html>…"
          rows={14}
          value={props.html}
        />
        {props.error ? (
          <Card padding={3} radius={2} tone="critical">
            <Text size={1}>{props.error}</Text>
          </Card>
        ) : null}
        <Flex justify="flex-end">
          <Button
            disabled={props.patchDisabled || props.html.trim().length === 0}
            onClick={props.onImport}
            text="Import"
            tone="primary"
          />
        </Flex>
      </Stack>
    </Box>
  )
}

export {ImportHtmlAction}
