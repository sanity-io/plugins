/**
 * Saturation / value box.
 *
 * Forked from
 * {@link https://github.com/casesandberg/react-color/blob/v2.19.3/src/components/common/Saturation.js | react-color's Saturation}
 * (MIT, Copyright (c) 2015 Case Sandberg). See the plugin LICENSE.
 */
import throttle from 'lodash-es/throttle'
import {useEffect, useMemo, useRef, type CSSProperties, type ReactElement} from 'react'
import {styled} from 'styled-components'

import * as saturation from './helpers/saturation'
import {useDrag} from './helpers/useDrag'
import type {
  ColorChangeHandler,
  HSLColor,
  HSVColor,
  PickerEvent,
  SaturationColorResult,
} from './types'

type ThrottledChange = ReturnType<
  typeof throttle<
    (handler: ColorChangeHandler<SaturationColorResult>, data: SaturationColorResult) => void
  >
>

const SaturationWhite = styled.div`
  background: linear-gradient(to right, #fff, rgba(255, 255, 255, 0));
`

const SaturationBlack = styled.div`
  background: linear-gradient(to top, #000, rgba(0, 0, 0, 0));
`

export interface SaturationProps {
  hsl: HSLColor
  hsv: HSVColor
  radius?: string | undefined
  shadow?: string | undefined
  onChange?: ColorChangeHandler<SaturationColorResult> | undefined
}

export function Saturation({hsl, hsv, radius, shadow, onChange}: SaturationProps): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null)

  const throttledChange = useMemo<ThrottledChange>(
    () =>
      throttle(
        (handler: ColorChangeHandler<SaturationColorResult>, data: SaturationColorResult): void => {
          handler(data)
        },
        50,
      ),
    [],
  )

  useEffect(() => {
    return () => {
      throttledChange.cancel()
    }
  }, [throttledChange])

  const handleChange = (event: PickerEvent) => {
    const container = containerRef.current
    if (!container || typeof onChange !== 'function') {
      return
    }
    throttledChange(onChange, saturation.calculateChange(event, hsl, container))
  }

  useDrag(containerRef, {
    onDragStart: (event) => {
      handleChange(event)
      return true
    },
    onDrag: handleChange,
    // Track the drag on the window the container is actually rendered in
    // (the Studio can render inputs inside nested iframes).
    getWindow: () => {
      let renderWindow: Window = window
      while (
        !renderWindow.document.contains(containerRef.current) &&
        renderWindow.parent !== renderWindow
      ) {
        renderWindow = renderWindow.parent
      }
      return renderWindow
    },
  })

  const pointerStyle: CSSProperties = {
    position: 'absolute',
    top: `${-(hsv.v * 100) + 100}%`,
    left: `${hsv.s * 100}%`,
    cursor: 'default',
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `hsl(${hsl.h},100%, 50%)`,
        borderRadius: radius,
      }}
      ref={containerRef}
      onTouchMove={handleChange}
      onTouchStart={handleChange}
    >
      <SaturationWhite style={{position: 'absolute', inset: 0, borderRadius: radius}}>
        <SaturationBlack
          style={{position: 'absolute', inset: 0, boxShadow: shadow, borderRadius: radius}}
        />
        <div style={pointerStyle}>
          <div
            style={{
              width: '4px',
              height: '4px',
              boxShadow:
                '0 0 0 1.5px #fff, inset 0 0 1px 1px rgba(0,0,0,.3), 0 0 1px 2px rgba(0,0,0,.4)',
              borderRadius: '50%',
              cursor: 'pointer',
              transform: 'translate(-2px, -2px)',
            }}
          />
        </div>
      </SaturationWhite>
    </div>
  )
}
