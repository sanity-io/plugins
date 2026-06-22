import {Box, Card, Container, Heading, Stack, Text} from '@sanity/ui'
import {Fragment, type PropsWithChildren} from 'react'

// React component that wraps text between two delimiters in a <code> tag

const WrapCodeBlocks = ({text}: {text: string}) => {
  return (
    <>
      {text.split('`').map((part, i) => (
        // oxlint-disable-next-line react/no-array-index-key - split text segments are purely positional
        <Fragment key={i}>{i % 2 === 0 ? part : <code>{part}</code>}</Fragment>
      ))}
    </>
  )
}

const DeskWarning = (
  props: PropsWithChildren<{
    title: string
    subtitle?: string
  }>,
) => {
  return (
    <Container padding={5} style={{maxWidth: '25rem'}} sizing={'content'}>
      <Card padding={4} border radius={2} width={0} tone="caution">
        <Stack gap={3}>
          <Heading size={1}>{props.title}</Heading>
          {props.subtitle &&
            props.subtitle.split('\\n').map((line: string) => (
              <Text size={1} key={line}>
                <WrapCodeBlocks text={line} />
              </Text>
            ))}
          {props.children && <Box marginTop={2}>{props.children}</Box>}
        </Stack>
      </Card>
    </Container>
  )
}

export default DeskWarning
