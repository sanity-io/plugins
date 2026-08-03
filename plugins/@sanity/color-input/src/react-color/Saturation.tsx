/**
 * Saturation / value box.
 *
 * Forked from
 * {@link https://github.com/casesandberg/react-color/blob/v2.19.3/src/components/common/Saturation.js | react-color's Saturation}
 * (MIT, Copyright (c) 2015 Case Sandberg). See the plugin LICENSE.
 */
import {assignInlineVars} from '@vanilla-extract/dynamic'
import throttle from 'lodash-es/throttle'
import {useEffect, useMemo, useRef, type ReactElement} from 'react'

import * as saturation from './helpers/saturation'
import {useDrag} from './helpers/useDrag'
import type {
  ColorChangeHandler,
  HSLColor,
  HSVColor,
  PickerEvent,
  SaturationColorResult,
} from './types'

import {
  black,
  hueBackgroundVar,
  pointer,
  pointerKnob,
  pointerLeftVar,
  pointerTopVar,
  radiusVar,
  root,
  shadowVar,
  white,
} from './Saturation.css'

type ThrottledChange = ReturnType<
  typeof throttle<
    (handler: ColorChangeHandler<SaturationColorResult>, data: SaturationColorResult) => void
  >
>

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

  return (
    <div
      className={root}
      style={assignInlineVars({
        [hueBackgroundVar]: `hsl(${hsl.h},100%, 50%)`,
        [radiusVar]: radius,
        [shadowVar]: shadow,
        [pointerTopVar]: `${-(hsv.v * 100) + 100}%`,
        [pointerLeftVar]: `${hsv.s * 100}%`,
      })}
      ref={containerRef}
      onTouchMove={handleChange}
      onTouchStart={handleChange}
    >
      <div className={white}>
        <div className={black} />
        <div className={pointer}>
          <div className={pointerKnob} />
        </div>
      </div>
    </div>
  )
}
