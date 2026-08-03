/**
 * Translates a pointer event over the saturation/value box into a new color.
 *
 * Forked from
 * {@link https://github.com/casesandberg/react-color/blob/v2.19.3/src/helpers/saturation.js | react-color's saturation helper}
 * (MIT, Copyright (c) 2015 Case Sandberg). See the plugin LICENSE.
 */
import type {HSLColor, PickerEvent, SaturationColorResult} from '../types'

export function calculateChange(
  e: PickerEvent,
  hsl: HSLColor,
  container: HTMLElement,
): SaturationColorResult {
  const {width: containerWidth, height: containerHeight} = container.getBoundingClientRect()
  const x = 'touches' in e ? (e.touches[0]?.pageX ?? 0) : e.pageX
  const y = 'touches' in e ? (e.touches[0]?.pageY ?? 0) : e.pageY
  let left = x - (container.getBoundingClientRect().left + window.scrollX)
  let top = y - (container.getBoundingClientRect().top + window.scrollY)

  if (left < 0) {
    left = 0
  } else if (left > containerWidth) {
    left = containerWidth
  }

  if (top < 0) {
    top = 0
  } else if (top > containerHeight) {
    top = containerHeight
  }

  const saturation = left / containerWidth
  const bright = 1 - top / containerHeight

  return {h: hsl.h, s: saturation, v: bright, a: hsl.a ?? 1, source: 'hsv'}
}
