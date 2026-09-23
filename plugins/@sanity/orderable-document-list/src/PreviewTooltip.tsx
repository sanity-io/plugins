import {Tooltip, type TooltipProps} from '@sanity/ui/tooltip'
import {type MouseEvent, type ReactNode, useCallback, useEffect, useState} from 'react'

const TOOLTIP_FALLBACK_PLACEMENTS: TooltipProps['fallbackPlacements'] = ['top-end', 'bottom-end']

export interface PreviewTooltipProps {
  children: ReactNode
  content: ReactNode
  disabled?: boolean
}

/**
 * Hover tooltip for a preview row, ported from Studio's internal
 * `PreviewTooltip` (`packages/sanity/src/core/preview/components/PreviewTooltip.tsx`
 * in sanity-io/sanity, not exported from `sanity`).
 *
 * The row lives in a scrollable, reorderable list. Scrolling the list, or a
 * drag reordering it, moves the row under a stationary pointer without firing
 * `mouseleave`, so a plain tooltip would stay open, detached from the row it
 * was anchored to. Force-close it on any ancestor scroll while the row is
 * hovered; it can open again once the pointer re-enters a row. The caller
 * suppresses it separately during a drag via `disabled`, since dragging moves
 * rows with a CSS transform rather than a scroll.
 */
export function PreviewTooltip(props: PreviewTooltipProps) {
  const {children, content, disabled} = props
  const [hovered, setHovered] = useState(false)
  const [suspended, setSuspended] = useState(false)

  // The `mouseover`/`mouseout` pair is used (rather than mouseenter/mouseleave)
  // because the Tooltip clones its child and replaces any mouseenter/mouseleave
  // handlers on it with its own.
  const handleMouseOver = useCallback(() => {
    setHovered(true)
  }, [])

  const handleMouseOut = useCallback((event: MouseEvent<HTMLDivElement>) => {
    // Moving between descendants of the row also fires mouseout; only reset
    // when the pointer actually leaves the row.
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
      return
    }
    setHovered(false)
    setSuspended(false)
  }, [])

  useEffect(() => {
    if (!hovered) {
      return undefined
    }
    const handleScroll = () => setSuspended(true)
    // Capture phase, since scroll events don't bubble from nested containers.
    window.addEventListener('scroll', handleScroll, {capture: true, passive: true})
    return () => window.removeEventListener('scroll', handleScroll, {capture: true})
  }, [hovered])

  return (
    <Tooltip
      content={content}
      disabled={disabled || suspended}
      fallbackPlacements={TOOLTIP_FALLBACK_PLACEMENTS}
      placement="right"
      portal
      delay={{open: 400}}
      boundaryElement={null}
    >
      {/* Tooltips won't trigger without a wrapping element */}
      {/* oxlint-disable-next-line jsx-a11y/mouse-events-have-key-events -- focus/blur handlers here would be dead code: the Tooltip clones this element and installs its own onFocus/onBlur (keyboard support), while the scroll suppression is inherently pointer-driven */}
      <div onMouseOut={handleMouseOut} onMouseOver={handleMouseOver}>
        {children}
      </div>
    </Tooltip>
  )
}
