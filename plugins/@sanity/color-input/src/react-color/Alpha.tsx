/**
 * Alpha (transparency) slider.
 *
 * Forked from
 * {@link https://github.com/casesandberg/react-color/blob/v2.19.3/src/components/common/Alpha.js | react-color's Alpha}
 * (MIT, Copyright (c) 2015 Case Sandberg). See the plugin LICENSE.
 */
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {useRef, type ReactElement} from 'react'

import {Checkboard} from './Checkboard'
import * as alpha from './helpers/alpha'
import {useDrag} from './helpers/useDrag'
import type {
  AlphaColorResult,
  CheckboardRenderers,
  ColorChangeHandler,
  HSLColor,
  PickerEvent,
  RGBColor,
} from './types'

import {
  checkboardLayer,
  container,
  gradientLayer,
  gradientVar,
  pointer,
  pointerKnob,
  pointerLeftVar,
  pointerTopVar,
  radiusVar,
  root,
  shadowVar,
} from './Alpha.css'

export interface AlphaProps {
  rgb: RGBColor
  hsl: HSLColor
  a?: number | undefined
  direction?: 'horizontal' | 'vertical' | undefined
  radius?: string | undefined
  shadow?: string | undefined
  renderers?: CheckboardRenderers | undefined
  onChange?: ColorChangeHandler<AlphaColorResult> | undefined
}

export function Alpha({
  rgb,
  hsl,
  a,
  direction,
  radius,
  shadow,
  renderers,
  onChange,
}: AlphaProps): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null)

  const handleChange = (event: PickerEvent) => {
    const containerEl = containerRef.current
    if (!containerEl) {
      return
    }
    const change = alpha.calculateChange(event, hsl, direction, a, containerEl)
    if (change && typeof onChange === 'function') {
      onChange(change)
    }
  }

  useDrag(containerRef, {
    onDragStart: (event) => {
      handleChange(event)
      return true
    },
    onDrag: handleChange,
  })

  const alphaValue = rgb.a ?? 1
  const gradient =
    direction === 'vertical'
      ? `linear-gradient(to bottom, rgba(${rgb.r},${rgb.g},${rgb.b}, 0) 0%, rgba(${rgb.r},${rgb.g},${rgb.b}, 1) 100%)`
      : `linear-gradient(to right, rgba(${rgb.r},${rgb.g},${rgb.b}, 0) 0%, rgba(${rgb.r},${rgb.g},${rgb.b}, 1) 100%)`
  const pointerDirection = direction === 'vertical' ? 'vertical' : 'horizontal'

  return (
    <div
      className={root}
      style={assignInlineVars({
        [radiusVar]: radius,
        [shadowVar]: shadow,
        [gradientVar]: gradient,
        [pointerLeftVar]: pointerDirection === 'horizontal' ? `${alphaValue * 100}%` : undefined,
        [pointerTopVar]: pointerDirection === 'vertical' ? `${alphaValue * 100}%` : undefined,
      })}
    >
      <div className={checkboardLayer}>
        <Checkboard renderers={renderers} />
      </div>
      <div className={gradientLayer} />
      <div
        className={container}
        ref={containerRef}
        onTouchMove={handleChange}
        onTouchStart={handleChange}
      >
        <div className={pointer[pointerDirection]}>
          <div className={pointerKnob} />
        </div>
      </div>
    </div>
  )
}
