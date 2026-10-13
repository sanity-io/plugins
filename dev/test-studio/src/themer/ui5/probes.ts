import {useLayoutEffect, useRef, useState} from 'react'

/** The computed properties a probe can read */
export type ProbeProperty =
  | 'background-color'
  | 'border-top-color'
  | 'box-shadow'
  | 'color'
  | 'outline-color'

/**
 * The attributes that make an element a probe: after every change to the
 * theme or the mapping, the section around it reads the computed value of
 * the property off the element, keyed by the id.
 */
export function probe(id: string, property: ProbeProperty) {
  return {'data-probe': id, 'data-probe-property': property}
}

let canvasContext: CanvasRenderingContext2D | null | undefined
const hexColors = new Map<string, string>()

function toHexPart(channel: number): string {
  return channel.toString(16).padStart(2, '0')
}

/**
 * Normalizes a computed color — `rgb()`, `color(srgb …)`, `oklch()`, whatever
 * the browser serializes it as — to `#rrggbb`, or `#rrggbbaa` when it is not
 * opaque, by painting it: so that colors compare by what they look like
 */
function toHex(color: string): string {
  const cached = hexColors.get(color)
  if (cached !== undefined) return cached

  canvasContext ??= document.createElement('canvas').getContext('2d', {willReadFrequently: true})
  if (!canvasContext) return color

  canvasContext.clearRect(0, 0, 1, 1)
  canvasContext.fillStyle = color
  canvasContext.fillRect(0, 0, 1, 1)
  const [red = 0, green = 0, blue = 0, alpha = 0] = canvasContext.getImageData(0, 0, 1, 1).data
  const hex = `#${toHexPart(red)}${toHexPart(green)}${toHexPart(blue)}${alpha === 255 ? '' : toHexPart(alpha)}`

  hexColors.set(color, hex)

  return hex
}

function readProbes(container: HTMLElement): Map<string, string> {
  const readings = new Map<string, string>()

  for (const element of Array.from(container.querySelectorAll<HTMLElement>('[data-probe]'))) {
    const id = element.dataset['probe']
    const property = element.dataset['probeProperty']
    if (!id || !property) continue

    const value = getComputedStyle(element).getPropertyValue(property).trim()
    readings.set(id, property === 'box-shadow' ? value : toHex(value))
  }

  return readings
}

/**
 * Reads the probes inside the returned ref's element once the theme or the
 * mapping — the `revision` — has rendered, along with the v4 theme they are
 * rendered with. Readings taken for an earlier revision are not returned,
 * so nothing shows a value the current preview doesn't have.
 */
export function useProbeReadings(
  revision: string,
  theme: object,
): [
  ref: React.RefObject<HTMLDivElement | null>,
  readings: ReadonlyMap<string, string> | undefined,
] {
  const ref = useRef<HTMLDivElement>(null)
  const [readings, setReadings] = useState<{
    revision: string
    theme: object
    values: ReadonlyMap<string, string>
  } | null>(null)

  useLayoutEffect(() => {
    const container = ref.current
    if (!container) return

    setReadings({revision, theme, values: readProbes(container)})
  }, [revision, theme])

  return [
    ref,
    readings && readings.revision === revision && readings.theme === theme
      ? readings.values
      : undefined,
  ]
}
