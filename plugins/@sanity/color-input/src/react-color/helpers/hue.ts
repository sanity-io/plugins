/**
 * Translates a pointer event over the hue track into a new hue value.
 *
 * Forked from
 * {@link https://github.com/casesandberg/react-color/blob/v2.19.3/src/helpers/hue.js | react-color's hue helper}
 * (MIT, Copyright (c) 2015 Case Sandberg). See the plugin LICENSE.
 */
import type {HSLColor, HueColorResult, PickerEvent} from '../types'

export function calculateChange(
  e: PickerEvent,
  direction: 'horizontal' | 'vertical' | undefined,
  hsl: HSLColor,
  container: HTMLElement,
): HueColorResult | null {
  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight
  const x = 'touches' in e ? (e.touches[0]?.pageX ?? 0) : e.pageX
  const y = 'touches' in e ? (e.touches[0]?.pageY ?? 0) : e.pageY
  const left = x - (container.getBoundingClientRect().left + window.scrollX)
  const top = y - (container.getBoundingClientRect().top + window.scrollY)

  if (direction === 'vertical') {
    let h: number
    if (top < 0) {
      h = 359
    } else if (top > containerHeight) {
      h = 0
    } else {
      const percent = -((top * 100) / containerHeight) + 100
      h = (360 * percent) / 100
    }

    if (hsl.h !== h) {
      return {h, s: hsl.s, l: hsl.l, a: hsl.a ?? 1, source: 'hsl'}
    }
    return null
  }

  let h: number
  if (left < 0) {
    h = 0
  } else if (left > containerWidth) {
    h = 359
  } else {
    const percent = (left * 100) / containerWidth
    h = (360 * percent) / 100
  }

  if (hsl.h !== h) {
    return {h, s: hsl.s, l: hsl.l, a: hsl.a ?? 1, source: 'hsl'}
  }
  return null
}
