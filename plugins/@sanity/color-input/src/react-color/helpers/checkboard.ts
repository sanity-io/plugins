/**
 * Renders a checkerboard pattern as a data URL, used as the transparency backdrop.
 *
 * Forked from
 * {@link https://github.com/casesandberg/react-color/blob/v2.19.3/src/helpers/checkboard.js | react-color's checkboard helper}
 * (MIT, Copyright (c) 2015 Case Sandberg). See the plugin LICENSE.
 */

const checkboardCache: Record<string, string | null> = {}

function render(
  c1: string,
  c2: string,
  size: number,
  serverCanvas?: new () => HTMLCanvasElement,
): string | null {
  if (typeof document === 'undefined' && !serverCanvas) {
    return null
  }
  const canvas = serverCanvas ? new serverCanvas() : document.createElement('canvas')
  canvas.width = size * 2
  canvas.height = size * 2
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    // If no context can be found, return early.
    return null
  }
  ctx.fillStyle = c1
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = c2
  ctx.fillRect(0, 0, size, size)
  ctx.translate(size, size)
  ctx.fillRect(0, 0, size, size)
  return canvas.toDataURL()
}

export function get(
  c1: string,
  c2: string,
  size: number,
  serverCanvas?: new () => HTMLCanvasElement,
): string | null {
  const key = `${c1}-${c2}-${size}${serverCanvas ? '-server' : ''}`
  const cached = checkboardCache[key]
  if (cached) {
    return cached
  }
  const checkboard = render(c1, c2, size, serverCanvas)
  checkboardCache[key] = checkboard
  return checkboard
}
