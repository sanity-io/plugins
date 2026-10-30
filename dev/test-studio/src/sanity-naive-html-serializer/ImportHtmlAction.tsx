import {ClipboardIcon} from '@sanity/icons/Clipboard'
import {Box, Button, Card, Flex, Stack, Text, TextArea} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {useCallback, useMemo, useRef, useState} from 'react'
import {type DocumentActionComponent, useDocumentOperation} from 'sanity'

import {articleFromHtml, type ArticleImport} from './articleFromHtml'

const ImportHtmlAction: DocumentActionComponent = (props) => {
  const {patch} = useDocumentOperation(props.id, props.type)
  const {push: pushToast} = useToast()
  const [open, setOpen] = useState(false)
  const patchRef = useRef(patch)
  const pushToastRef = useRef(pushToast)

  patchRef.current = patch
  pushToastRef.current = pushToast

  const close = useCallback(() => {
    setOpen(false)
  }, [])

  const onImported = useCallback((fields: ArticleImport) => {
    patchRef.current.execute([{set: fields}])
    setOpen(false)
    pushToastRef.current({
      closable: true,
      status: 'success',
      title: 'Imported HTML into this article',
    })
  }, [])

  // The studio compares this dialog with ===. A new object on each keystroke
  // rebuilds the modal and moves the textarea caret to the end.
  const dialog = useMemo(() => {
    if (!open) return false
    return {
      type: 'dialog' as const,
      header: 'Import translated HTML',
      width: 'large' as const,
      onClose: close,
      content: <ImportHtmlDialog onImported={onImported} />,
    }
  }, [close, onImported, open])

  return {
    label: 'Import HTML',
    icon: ClipboardIcon,
    title: 'Paste serialized HTML and apply it to this article',
    disabled: !props.id,
    onHandle: () => {
      setOpen(true)
    },
    dialog,
  }
}

function ImportHtmlDialog(props: {onImported: (fields: ArticleImport) => void}) {
  const [html, setHtml] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleImport = () => {
    const result = articleFromHtml(html)
    if (!result.ok) {
      setError(result.message)
      return
    }
    props.onImported(result.fields)
  }

  return (
    <Box padding={4}>
      <Stack gap={4}>
        <Text muted size={1}>
          Paste the serialized HTML from HTML Preview, with whatever edits you made. Title, snippet,
          and content on this article are replaced. The document id stays the same.
        </Text>
        <TextArea
          aria-label="Serialized HTML"
          onChange={(event) => {
            setHtml(event.currentTarget.value)
            setError(null)
          }}
          placeholder="<html>…"
          rows={14}
          value={html}
        />
        {error ? (
          <Card padding={3} radius={2} tone="critical">
            <Text size={1}>{error}</Text>
          </Card>
        ) : null}
        <Flex justify="flex-end">
          <Button
            disabled={html.trim().length === 0}
            onClick={handleImport}
            text="Import"
            tone="primary"
          />
        </Flex>
      </Stack>
    </Box>
  )
}

export {ImportHtmlAction}
