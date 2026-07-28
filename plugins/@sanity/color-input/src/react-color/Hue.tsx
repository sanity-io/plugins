/**
 * Hue slider.
 *
 * Forked from
 * {@link https://github.com/casesandberg/react-color/blob/v2.19.3/src/components/common/Hue.js | react-color's Hue}
 * (MIT, Copyright (c) 2015 Case Sandberg). See the plugin LICENSE.
 */
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {useRef, type ReactElement} from 'react'

import * as hue from './helpers/hue'
import {useDrag} from './helpers/useDrag'
import type {ColorChangeHandler, HSLColor, HueColorResult, PickerEvent} from './types'

import {
  gradient,
  pointer,
  pointerKnob,
  pointerLeftVar,
  pointerTopVar,
  radiusVar,
  root,
  shadowVar,
} from './Hue.css'

export interface HueProps {
  hsl: HSLColor
  direction?: 'horizontal' | 'vertical' | undefined
  radius?: string | undefined
  shadow?: string | undefined
  onChange?: ColorChangeHandler<HueColorResult> | undefined
}

export function Hue({
  hsl,
  direction = 'horizontal',
  radius,
  shadow,
  onChange,
}: HueProps): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null)

  const handleChange = (event: PickerEvent) => {
    const container = containerRef.current
    if (!container) {
      return
    }
    const change = hue.calculateChange(event, direction, hsl, container)
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

  const pointerDirection = direction === 'vertical' ? 'vertical' : 'horizontal'

  return (
    <div
      className={root}
      style={assignInlineVars({
        [radiusVar]: radius,
        [shadowVar]: shadow,
        [pointerLeftVar]: pointerDirection === 'horizontal' ? `${(hsl.h * 100) / 360}%` : undefined,
        [pointerTopVar]:
          pointerDirection === 'vertical' ? `${-((hsl.h * 100) / 360) + 100}%` : undefined,
      })}
    >
      <div
        className={gradient[pointerDirection]}
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
