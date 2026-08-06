import type {SanityDocument} from '@sanity/client'
import {Box, Card, Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx/lite'
import {type ComponentProps} from 'react'
import {collate, useSchema} from 'sanity'

import {DocumentPreview} from '../documentPreview/DocumentPreview'
import SpinnerBox from '../SpinnerBox'

import {container, fgVar} from './VideoReferences.css'

function Container({className, style, ...props}: ComponentProps<typeof Box>) {
  const {color} = useThemeV2()

  return (
    <Box
      {...props}
      className={clsx(container, className)}
      style={{...assignInlineVars({[fgVar]: color.fg}), ...style}}
    />
  )
}

const VideoReferences: React.FC<{
  references?: SanityDocument[]
  isLoaded: boolean
}> = (props) => {
  const schema = useSchema()
  if (!props.isLoaded) {
    return <SpinnerBox />
  }

  if (!props.references?.length) {
    return (
      <Card border radius={3} padding={3}>
        <Text size={2}>No documents are using this video</Text>
      </Card>
    )
  }

  const documentPairs = collate(props.references || [])
  return (
    <Container>
      {documentPairs?.map((documentPair) => {
        const schemaType = schema.get(documentPair.type)

        return (
          <Card
            key={documentPair.id}
            marginBottom={2}
            padding={2}
            radius={2}
            shadow={1}
            style={{overflow: 'hidden'}}
          >
            <Box>
              <DocumentPreview documentPair={documentPair} schemaType={schemaType} />
            </Box>
          </Card>
        )
      })}
    </Container>
  )
}

export default VideoReferences
