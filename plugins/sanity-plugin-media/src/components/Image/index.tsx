import type {ThemeColorSchemeKey} from '@sanity/ui/theme'
import {type ComponentProps, type CSSProperties} from 'react'

import {getSchemeColor} from '../../utils/getSchemeColor'

import * as styles from './Image.module.css'

type Props = ComponentProps<'img'> & {
  scheme?: ThemeColorSchemeKey
  showCheckerboard?: boolean
}

interface ImageStyle extends CSSProperties {
  '--media-checkerboard-color'?: string
}

function Image({alt = '', className, scheme, showCheckerboard, style, ...props}: Props) {
  const imageStyle: ImageStyle = {
    ...style,
    '--media-checkerboard-color': scheme ? getSchemeColor(scheme, 'bg2') : undefined,
  }

  return (
    <img
      {...props}
      alt={alt}
      className={[showCheckerboard ? styles.imageCheckerboard : styles.image, className]
        .filter(Boolean)
        .join(' ')}
      style={imageStyle}
    />
  )
}

export default Image
