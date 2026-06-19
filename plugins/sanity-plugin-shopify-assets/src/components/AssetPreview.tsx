import {Box, Flex, Text} from '@sanity/ui'
import {getTheme_v2} from '@sanity/ui/theme'
import prettyBytes from 'pretty-bytes'
import prettyMilliseconds from 'pretty-ms'
import {styled} from 'styled-components'

import type {Asset} from '../types'
import {DurationLine, InfoLine} from './File.styled'
import VideoPlayer from './VideoPlayer'

interface ComponentProps {
  value: Asset | undefined
}

const StyledBox = styled(Box)`
  ${({theme}) => {
    const v2 = getTheme_v2({sanity: theme.sanity})
    return `
      background-color: ${v2.color.muted.bg};
      border: 1px solid ${v2.color.border};
    `
  }};
  display: flex;
  justify-content: center;
  position: relative;
`

const RenderAsset = ({value, url}: {value: Asset; url: string}) => {
  switch (value.type) {
    case 'video':
      return <VideoPlayer src={url} kind="player" />
    default:
      return (
        <Flex justify="center">
          <img
            alt="preview"
            src={value?.preview?.url}
            style={{
              maxWidth: '100%',
              height: 'auto',
              display: 'block',
              maxHeight: '30vh',
            }}
          />
        </Flex>
      )
  }
}

const AssetPreview = ({value}: ComponentProps) => {
  const url = value && value.url

  if (!value || !url) {
    return null
  }

  const {filename, meta} = value
  const {fileSize, duration} = meta

  return (
    <StyledBox marginBottom={2}>
      <RenderAsset value={value} url={url} />
      <InfoLine padding={2} radius={2} margin={2}>
        <Text size={1} title={`Select ${filename}`}>
          {filename} {fileSize && `(${prettyBytes(fileSize)})`}
        </Text>
      </InfoLine>
      {duration && (
        <DurationLine padding={2} radius={2} margin={2}>
          <Text size={1} title={`Video duration: ${filename}`}>
            {prettyMilliseconds(duration, {colonNotation: true, secondsDecimalDigits: 0})}
          </Text>
        </DurationLine>
      )}
    </StyledBox>
  )
}

export default AssetPreview
