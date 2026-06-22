/**
 * Translates a pointer event over the alpha track into a new alpha value.
 *
 * Forked from
 * {@link https://github.com/casesandberg/react-color/blob/v2.19.3/src/helpers/alpha.js | react-color's alpha helper}
 * (MIT, Copyright (c) 2015 Case Sandberg). See the plugin LICENSE.
 */
import type {AlphaColorResult, HSLColor, PickerEvent} from '../types'

export function calculateChange(
  e: PickerEvent,
  hsl: HSLColor,
  direction: 'horizontal' | 'vertical' | undefined,
  initialA: number | undefined,
  container: HTMLElement,
): AlphaColorResult | null {
  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight
  const x = 'touches' in e ? (e.touches[0]?.pageX ?? 0) : e.pageX
  const y = 'touches' in e ? (e.touches[0]?.pageY ?? 0) : e.pageY
  const left = x - (container.getBoundingClientRect().left + window.scrollX)
  const top = y - (container.getBoundingClientRect().top + window.scrollY)

  if (direction === 'vertical') {
    let a: number
    if (top < 0) {
      a = 0
    } else if (top > containerHeight) {
      a = 1
    } else {
      a = Math.round((top * 100) / containerHeight) / 100
    }

    if (hsl.a !== a) {
      return {h: hsl.h, s: hsl.s, l: hsl.l, a, source: 'rgb'}
    }
    return null
  }

  let a: number
  if (left < 0) {
    a = 0
  } else if (left > containerWidth) {
    a = 1
  } else {
    a = Math.round((left * 100) / containerWidth) / 100
  }

  if (initialA !== a) {
    return {h: hsl.h, s: hsl.s, l: hsl.l, a, source: 'rgb'}
  }
  return null
}
