import {Box, Flex, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx/lite'
import {type ComponentProps, type MouseEvent} from 'react'
import {defaultStyles, FileIcon as ReactFileIcon} from 'react-file-icon'
import type {DefaultExtensionType} from 'react-file-icon'

import {container, fontFamilyVar} from './FileIcon.css'

type Props = {
  extension?: string
  onClick?: (e: MouseEvent) => void
  width: string
}

function Container({className, style, ...props}: ComponentProps<typeof Box>) {
  const {font} = useThemeV2()

  return (
    <Box
      {...props}
      className={clsx(container, className)}
      style={{...style, ...assignInlineVars({[fontFamilyVar]: font.text.family})}}
    />
  )
}

const FileIcon = (props: Props) => {
  const {extension, onClick, width} = props

  return (
    <Flex align="center" justify="center" onClick={onClick} style={{height: '100%'}}>
      <Container style={{width}}>
        {extension ? (
          <ReactFileIcon
            extension={extension}
            {...defaultStyles[extension as DefaultExtensionType]}
          />
        ) : (
          <ReactFileIcon />
        )}
      </Container>
    </Flex>
  )
}

export default FileIcon
