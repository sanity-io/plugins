/**
 * Color model and picker prop types used by the forked `react-color` components.
 *
 * Adapted from
 * {@link https://github.com/casesandberg/react-color/blob/v2.19.3/src/index.js | react-color}
 * and its DefinitelyTyped definitions
 * ({@link https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react-color | @types/react-color}).
 * MIT, Copyright (c) 2015 Case Sandberg. See the plugin LICENSE.
 */
import type {MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent} from 'react'

export interface HEXColor {
  hex: string
  source?: string | undefined
}

export interface HSLColor {
  a?: number | undefined
  h: number
  l: number
  s: number
  source?: string | undefined
}

export interface RGBColor {
  a?: number | undefined
  b: number
  g: number
  r: number
  source?: string | undefined
}

export interface HSVColor {
  a?: number | undefined
  h: number
  s: number
  v: number
  source?: string | undefined
}

export type Color = string | HEXColor | HSLColor | RGBColor | HSVColor

export interface ColorState {
  hex: string
  hsl: HSLColor
  hsv: HSVColor
  rgb: RGBColor
  oldHue: number
  source: string
}

export type ColorChangeHandler<T = HSLColor | HSVColor | RGBColor> = (color: T) => void

/** Optional server-side `<canvas>` constructor, used to render the checkerboard during SSR. */
export interface CheckboardRenderers {
  canvas?: (new () => HTMLCanvasElement) | undefined
}

export interface RenderersProps {
  renderers?: CheckboardRenderers | undefined
}

export interface SaturationColorResult extends HSVColor {
  a: number
  source: 'hsv'
}

export interface HueColorResult extends HSLColor {
  a: number
  source: 'hsl'
}

export interface AlphaColorResult extends HSLColor {
  a: number
  source: 'rgb'
}

/** A pointer event delivered to a picker drag handler: either a native or a React synthetic event. */
export type PickerEvent =
  | MouseEvent
  | TouchEvent
  | ReactMouseEvent<HTMLElement>
  | ReactTouchEvent<HTMLElement>
