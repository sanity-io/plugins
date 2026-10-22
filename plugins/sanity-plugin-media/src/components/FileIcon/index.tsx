import {Box, Flex, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {type CSSProperties, type MouseEvent} from 'react'
import {defaultStyles, FileIcon as ReactFileIcon} from 'react-file-icon'
import type {DefaultExtensionType} from 'react-file-icon'

import * as styles from './FileIcon.module.css'

type Props = {
  extension?: string
  onClick?: (e: MouseEvent) => void
  width: string
}

interface ContainerStyle extends CSSProperties {
  '--media-file-icon-font-family'?: string
}

const FileIcon = (props: Props) => {
  const {extension, onClick, width} = props
  const {font} = useThemeV2()

  const containerStyle: ContainerStyle = {
    width,
    '--media-file-icon-font-family': font.text.family,
  }

  return (
    <Flex align="center" justify="center" onClick={onClick} style={{height: '100%'}}>
      <Box className={styles.container} style={containerStyle}>
        {extension ? (
          <ReactFileIcon
            extension={extension}
            {...defaultStyles[extension as DefaultExtensionType]}
          />
        ) : (
          <ReactFileIcon />
        )}
      </Box>
    </Flex>
  )
}

export default FileIcon
