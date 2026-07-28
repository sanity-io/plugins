/**
 * Hue slider.
 *
 * Forked from
 * {@link https://github.com/casesandberg/react-color/blob/v2.19.3/src/components/common/Hue.js | react-color's Hue}
 * (MIT, Copyright (c) 2015 Case Sandberg). See the plugin LICENSE.
 */
import {useRef, type CSSProperties, type ReactElement} from 'react'
import {styled} from 'styled-components'

import * as hue from './helpers/hue'
import {useDrag} from './helpers/useDrag'
import type {ColorChangeHandler, HSLColor, HueColorResult, PickerEvent} from './types'

const HueGradient = styled.div<{$direction: 'horizontal' | 'vertical'}>`
  background: ${({$direction}) =>
    $direction === 'vertical'
      ? 'linear-gradient(to top, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)'
      : 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)'};
`

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

  const pointerStyle: CSSProperties =
    direction === 'vertical'
      ? {position: 'absolute', left: '0px', top: `${-((hsl.h * 100) / 360) + 100}%`}
      : {position: 'absolute', left: `${(hsl.h * 100) / 360}%`}

  return (
    <div style={{position: 'absolute', inset: 0, borderRadius: radius, boxShadow: shadow}}>
      <HueGradient
        $direction={direction}
        style={{padding: '0 2px', position: 'relative', height: '100%', borderRadius: radius}}
        ref={containerRef}
        onTouchMove={handleChange}
        onTouchStart={handleChange}
      >
        <div style={pointerStyle}>
          <div
            style={{
              marginTop: '1px',
              width: '4px',
              borderRadius: '1px',
              height: '8px',
              boxShadow: '0 0 2px rgba(0, 0, 0, .6)',
              background: '#fff',
              transform: 'translateX(-2px)',
            }}
          />
        </div>
      </HueGradient>
    </div>
  )
}
