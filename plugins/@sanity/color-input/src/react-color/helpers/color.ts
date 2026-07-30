/**
 * Color conversion and validation helpers built on `tinycolor2`.
 *
 * Forked from
 * {@link https://github.com/casesandberg/react-color/blob/v2.19.3/src/helpers/color.js | react-color's color helpers}
 * (MIT, Copyright (c) 2015 Case Sandberg). See the plugin LICENSE.
 */
import tinycolor from 'tinycolor2'

import type {Color, ColorState} from '../types'

const VALIDATION_KEYS = new Set(['r', 'g', 'b', 'a', 'h', 's', 'l', 'v'])
const PERCENT_PATTERN = /^\d+%$/

export function simpleCheckForValidColor(data: Color): Color | false {
  if (typeof data === 'string') {
    return data
  }

  let checked = 0
  let passed = 0
  for (const [key, value] of Object.entries(data)) {
    if (!VALIDATION_KEYS.has(key) || !value) {
      continue
    }
    checked += 1
    if (!Number.isNaN(Number(value))) {
      passed += 1
    }
    if ((key === 's' || key === 'l') && PERCENT_PATTERN.test(String(value))) {
      passed += 1
    }
  }

  return checked === passed ? data : false
}

export function toState(data: Color, oldHue?: number): ColorState {
  const instance =
    typeof data === 'string'
      ? tinycolor(data)
      : 'hex' in data
        ? tinycolor(data.hex)
        : tinycolor(data)
  const hsl = instance.toHsl()
  const hsv = instance.toHsv()
  const rgb = instance.toRgb()
  const hex = instance.toHex()

  if (hsl.s === 0) {
    hsl.h = oldHue ?? 0
    hsv.h = oldHue ?? 0
  }

  const transparent = hex === '000000' && rgb.a === 0
  const incomingHue = typeof data === 'string' ? undefined : 'h' in data ? data.h : undefined
  const source = typeof data === 'string' ? undefined : data.source

  return {
    hsl,
    hex: transparent ? 'transparent' : `#${hex}`,
    rgb,
    hsv,
    oldHue: incomingHue || oldHue || hsl.h,
    source: source ?? '',
  }
}

export function isValidHex(hex: string): boolean {
  if (hex === 'transparent') {
    return true
  }
  // Disallow hex4 and hex8 (with alpha) to match the original behavior.
  const lh = hex.charAt(0) === '#' ? 1 : 0
  return hex.length !== 4 + lh && hex.length < 7 + lh && tinycolor(hex).isValid()
}
