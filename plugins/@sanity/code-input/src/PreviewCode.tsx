import {Box, Card, Flex, Label, Text} from '@sanity/ui'
import {Suspense} from 'react'
import type {PreviewProps} from 'sanity'
import {styled} from 'styled-components'

import {CodeMirrorProxy, useMounted} from './codemirror/useCodeMirror'
import {useLanguageMode} from './codemirror/useLanguageMode'
import type {CodeInputValue, CodeSchemaType} from './types'

const PreviewContainer = styled(Box)`
  position: relative;
`

// Studio's inline object chip is `height: calc(1em - 1px)`. 13/16em matches
// Studio's inline preview text and fits in that content box.
const InlineCodeLabel = styled.span`
  box-sizing: border-box;
  display: block;
  font-size: 0.8125em;
  font-weight: 500;
  line-height: 1;
  margin: 0;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  padding: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
`

/**
 * @public
 */
export interface PreviewCodeProps extends PreviewProps {
  selection?: CodeInputValue
}

function inlineCodeLabel(props: PreviewCodeProps): string {
  if (typeof props.title === 'string') {
    const title = props.title.trim()
    if (title) return title
  }

  const filename = props.selection?.filename?.trim()
  if (filename) return filename

  const language = props.selection?.language?.trim()
  if (language) return language.toUpperCase()

  const firstLine = props.selection?.code
    ?.split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0)
  if (firstLine) return firstLine

  return 'Code'
}

/**
 * @public
 */
export function PreviewCode(props: PreviewCodeProps): React.JSX.Element {
  const {selection, schemaType: type, layout} = props
  // oxlint-disable-next-line no-unsafe-type-assertion - fix later
  const {languageMode} = useLanguageMode(type as CodeSchemaType, props.selection)

  const mounted = useMounted()

  if (layout === 'inline') {
    return (
      <InlineCodeLabel data-testid="inline-code-preview">{inlineCodeLabel(props)}</InlineCodeLabel>
    )
  }

  return (
    <PreviewContainer>
      <Card padding={4}>
        {selection?.filename || selection?.language ? (
          <Card
            paddingBottom={4}
            marginBottom={selection.code ? 4 : 0}
            borderBottom={!!selection.code}
          >
            <Flex align="center" justify="flex-end">
              {selection?.filename ? (
                <Box flex={1}>
                  <Text>
                    <code>{selection.filename}</code>
                  </Text>
                </Box>
              ) : null}
              {selection?.language ? <Label muted>{selection.language}</Label> : null}
            </Flex>
          </Card>
        ) : null}
        {mounted && (
          <Suspense fallback={<Card padding={2}>Loading code preview...</Card>}>
            <CodeMirrorProxy
              readOnly
              editable={false}
              value={selection?.code || ''}
              highlightLines={selection?.highlightedLines || []}
              basicSetup={{
                lineNumbers: false,
                foldGutter: false,
                highlightSelectionMatches: false,
                highlightActiveLineGutter: false,
                highlightActiveLine: false,
              }}
              languageMode={languageMode}
            />
          </Suspense>
        )}
      </Card>
    </PreviewContainer>
  )
}
