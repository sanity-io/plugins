import type {ThemeColorSchemeKey} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx/lite'
import {type ComponentProps} from 'react'

import {getSchemeColor} from '../../utils/getSchemeColor'

import {checkerboardColorVar, image, imageCheckerboard} from './Image.css'

type Props = Omit<ComponentProps<'img'>, 'crossOrigin'> & {
  scheme?: ThemeColorSchemeKey
  showCheckerboard?: boolean
}

function Image({alt = '', className, scheme, showCheckerboard, style, ...props}: Props) {
  return (
    <img
      {...props}
      alt={alt}
      crossOrigin="anonymous"
      className={clsx(showCheckerboard ? imageCheckerboard : image, className)}
      style={{
        ...style,
        ...(scheme && assignInlineVars({[checkerboardColorVar]: getSchemeColor(scheme, 'bg2')})),
      }}
    />
  )
}

export default Image
