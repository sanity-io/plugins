/**
 * Alpha (transparency) slider.
 *
 * Forked from
 * {@link https://github.com/casesandberg/react-color/blob/v2.19.3/src/components/common/Alpha.js | react-color's Alpha}
 * (MIT, Copyright (c) 2015 Case Sandberg). See the plugin LICENSE.
 */
import {useRef, type CSSProperties, type ReactElement} from 'react'

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
    const container = containerRef.current
    if (!container) {
      return
    }
    const change = alpha.calculateChange(event, hsl, direction, a, container)
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
  const pointerStyle: CSSProperties =
    direction === 'vertical'
      ? {position: 'absolute', left: 0, top: `${alphaValue * 100}%`}
      : {position: 'absolute', left: `${alphaValue * 100}%`}

  return (
    <div style={{position: 'absolute', inset: 0, borderRadius: radius}}>
      <div style={{position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: radius}}>
        <Checkboard renderers={renderers} />
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: gradient,
          boxShadow: shadow,
          borderRadius: radius,
        }}
      />
      <div
        style={{position: 'relative', height: '100%', margin: '0 3px'}}
        ref={containerRef}
        onTouchMove={handleChange}
        onTouchStart={handleChange}
      >
        <div style={pointerStyle}>
          <div
            style={{
              width: '4px',
              borderRadius: '1px',
              height: '8px',
              boxShadow: '0 0 2px rgba(0, 0, 0, .6)',
              background: '#fff',
              marginTop: '1px',
              transform: 'translateX(-2px)',
            }}
          />
        </div>
      </div>
    </div>
  )
}
