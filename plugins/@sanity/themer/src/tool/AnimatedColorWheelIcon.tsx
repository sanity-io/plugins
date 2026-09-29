import {motion, MotionValue, useTransform, animate, useMotionValue} from 'motion/react'
import {useEffect, useImperativeHandle} from 'react'

import {isSliceFilled, SLICE_COLORS, SLICE_COUNT, wheelRotation} from './colorWheel'
import {ANIMATION_DURATION} from './colorWheel'

/**
 * The geometry of `ColorWheelIcon` from `@sanity/icons`: a ring between two
 * circles around the center of a 25×25 viewBox, cut into eight slices by the
 * spokes of its outline path
 */
const CENTER = 12.5
const OUTER_RADIUS = 8
const INNER_RADIUS = 3.5
const OUTLINE =
  'M9.43853 5.10896L11.1606 9.26642M13.8394 15.7336L15.5615 19.891M15.7336 11.1606L19.891 9.43853M9.26642 13.8394L5.10896 15.5615M5.3139 9.52342L9.23359 11.147M15.7664 13.853L19.6861 15.4766M13.853 9.23359L15.4766 5.3139M9.52342 19.6861L11.147 15.7664M20.5 12.5C20.5 16.9183 16.9183 20.5 12.5 20.5C8.08172 20.5 4.5 16.9183 4.5 12.5C4.5 8.08172 8.08172 4.5 12.5 4.5C16.9183 4.5 20.5 8.08172 20.5 12.5ZM16 12.5C16 14.433 14.433 16 12.5 16C10.567 16 9 14.433 9 12.5C9 10.567 10.567 9 12.5 9C14.433 9 16 10.567 16 12.5Z'

const SLICE_ANGLE = 360 / SLICE_COUNT

/** A point on a circle around the center, at `degrees` clockwise from 3 o'clock */
function point(radius: number, degrees: number): string {
  const radians = (degrees * Math.PI) / 180

  return `${CENTER + radius * Math.cos(radians)} ${CENTER + radius * Math.sin(radians)}`
}

/**
 * The part of the ring a slice colors in: between its two spokes, from the
 * inner circle out to the outer. The 12 o'clock slice is centered on 12, so
 * it starts half a slice before it.
 */
function slicePath(index: number): string {
  const start = index * SLICE_ANGLE - SLICE_ANGLE / 2 - 90
  const end = start + SLICE_ANGLE

  return [
    `M${point(OUTER_RADIUS, start)}`,
    `A${OUTER_RADIUS} ${OUTER_RADIUS} 0 0 1 ${point(OUTER_RADIUS, end)}`,
    `L${point(INNER_RADIUS, end)}`,
    `A${INNER_RADIUS} ${INNER_RADIUS} 0 0 0 ${point(INNER_RADIUS, start)}`,
    'Z',
  ].join('')
}

const SLICE_PATHS = SLICE_COLORS.map((_, index) => slicePath(index))

/**
 * A filled shape, not a stroked one: the icon styles of `@sanity/ui` force
 * `vector-effect: non-scaling-stroke` on every path in an icon, which fills
 * are none the wiser about
 */
function Slice(props: {index: number; progress: MotionValue<number>}) {
  const {index, progress} = props
  const opacity = useTransform(progress, (value) => (isSliceFilled(value, index) ? 1 : 0))

  return <motion.path d={SLICE_PATHS[index]} fill={SLICE_COLORS[index]} style={{opacity}} />
}

/**
 * The `ColorWheelIcon` of `@sanity/icons`, with an animation driven by
 * `progress` (0–1): the slices pop in with color one at a time, clockwise
 * from 12 o'clock like the segments of a classic spinner, the wheel spins once
 * as the 6 o'clock slice pops in, and the colors pop out the same way round,
 * carrying the spin's speed to a rest (see `colorWheel.ts`). At rest — at
 * either end — it looks exactly like the icon it stands in for. With
 * `prefers-reduced-motion: reduce` the wheel keeps still; only the colors come
 * and go.
 *
 * @internal
 */
export default function AnimatedColorWheelIcon({
  busy,
  ref,
}: {
  busy: boolean
  ref: React.Ref<{spin: () => void}>
}) {
  const progress = useMotionValue(0)
  const rotate = useTransform(progress, (value) => wheelRotation(value))

  useImperativeHandle(
    ref,
    () => ({
      spin: () => {
        // A run in progress plays out — hovering again does not cut it short
        if (progress.isAnimating()) return

        animate(progress, [0, 1], {duration: ANIMATION_DURATION, ease: 'linear'})
      },
    }),
    [progress],
  )

  // Laps from wherever a hover's run has got to, so the wheel never jumps,
  // and the lap in progress as the code arrives plays out: at rest, the wheel
  // looks like the icon again
  useEffect(() => {
    if (!busy) return undefined

    let looping = false
    const raf = setTimeout(() => {
      looping = true
      const lap = (from: number) => {
        animate(progress, [from, 1], {
          duration: (1 - from) * ANIMATION_DURATION,
          ease: 'linear',
          onComplete: () => {
            if (looping) lap(0)
          },
        })
      }

      lap(progress.get())
    }, 160)

    return () => {
      clearTimeout(raf)
      looping = false
    }
  }, [busy, progress])

  useEffect(() => () => progress.stop(), [progress])

  return (
    <motion.svg
      data-sanity-icon="color-wheel"
      fill="none"
      height="1em"
      style={{rotate}}
      viewBox="0 0 25 25"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
    >
      {SLICE_COLORS.map((color, index) => (
        <Slice key={color} index={index} progress={progress} />
      ))}
      <path d={OUTLINE} stroke="currentColor" strokeLinejoin="round" strokeWidth={1.2} />
    </motion.svg>
  )
}
