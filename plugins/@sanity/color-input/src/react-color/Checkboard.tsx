/**
 * Checkerboard transparency backdrop.
 *
 * Forked from
 * {@link https://github.com/casesandberg/react-color/blob/v2.19.3/src/components/common/Checkboard.js | react-color's Checkboard}
 * (MIT, Copyright (c) 2015 Case Sandberg). See the plugin LICENSE. The upstream
 * `children` cloning branch is dropped as it is unused here.
 */
import {assignInlineVars} from '@vanilla-extract/dynamic'
import type {ReactElement} from 'react'

import * as checkboardHelper from './helpers/checkboard'
import type {CheckboardRenderers, RenderersProps} from './types'

import {backgroundImageVar, borderRadiusVar, boxShadowVar, checkboard} from './Checkboard.css'

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
  const background = checkboardHelper.get(white, grey, size, renderers.canvas)
  return (
    <div
      className={checkboard}
      style={assignInlineVars({
        [borderRadiusVar]: borderRadius,
        [boxShadowVar]: boxShadow,
        [backgroundImageVar]: background ? `url(${background}) center left` : undefined,
      })}
    />
  )
}
