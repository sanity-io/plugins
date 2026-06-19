/**
 * Checkerboard transparency backdrop.
 *
 * Forked from
 * {@link https://github.com/casesandberg/react-color/blob/v2.19.3/src/components/common/Checkboard.js | react-color's Checkboard}
 * (MIT, Copyright (c) 2015 Case Sandberg). See the plugin LICENSE. The upstream
 * `children` cloning branch is dropped as it is unused here.
 */
import type {ReactElement} from 'react'

import * as checkboard from './helpers/checkboard'
import type {CheckboardRenderers, RenderersProps} from './types'

const EMPTY_RENDERERS: CheckboardRenderers = {}

export interface CheckboardProps extends RenderersProps {
  white?: string | undefined
  grey?: string | undefined
  size?: number | undefined
  borderRadius?: string | undefined
  boxShadow?: string | undefined
}

export function Checkboard({
  white = 'transparent',
  grey = 'rgba(0,0,0,.08)',
  size = 8,
  renderers = EMPTY_RENDERERS,
  borderRadius,
  boxShadow,
}: CheckboardProps): ReactElement {
  const background = checkboard.get(white, grey, size, renderers.canvas)
  return (
    <div
      style={{
        borderRadius,
        boxShadow,
        position: 'absolute',
        inset: 0,
        background: background ? `url(${background}) center left` : undefined,
      }}
    />
  )
}
