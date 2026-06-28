import {CollapseIcon, ExpandIcon} from '@sanity/icons'
import {Box, Button, Card, Layer, Portal, Text, Tooltip} from '@sanity/ui'
import {type CSSProperties, type ReactNode, useCallback, useEffect, useRef, useState} from 'react'
import {css, styled} from 'styled-components'

import {focusRingBorderStyle, focusRingStyle} from './ui/focusRingStyle'

// Match the Studio's tooltip timing (TOOLTIP_DELAY_PROPS in `sanity`)
const TOOLTIP_DELAY = {open: 400}

// Default editor height; also the placeholder height while expanded.
const EDITOR_HEIGHT = 250

// Studio DOM markers for the document pane and its scroll container
const DOCUMENT_PANE_SELECTOR = '[data-testid="document-pane"]'
const DOCUMENT_PANEL_SCROLLER_SELECTOR = '[data-testid="document-panel-scroller"]'
// Selected pane — disambiguates split-view layouts
const SELECTED_PANE_SCROLLER_SELECTOR = `${DOCUMENT_PANE_SELECTOR}[data-pane-selected="true"] ${DOCUMENT_PANEL_SCROLLER_SELECTOR}`

// Nearest scrollable ancestor — last-resort pane fallback.
function getScrollParent(node: HTMLElement | null): HTMLElement | null {
  let current = node?.parentElement ?? null
  while (current) {
    const {overflowY} = window.getComputedStyle(current)
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
      return current
    }
    current = current.parentElement
  }
  return null
}

// Resolve the document pane's scroll container so the overlay fills the pane —
// not the viewport, and not a surrounding modal (rendered in a portal).
function getDocumentPaneElement(node: HTMLElement | null): HTMLElement | null {
  if (!node) return null

  const ownPane = node.closest(DOCUMENT_PANE_SELECTOR)
  if (ownPane instanceof HTMLElement) {
    const scroller = ownPane.querySelector(DOCUMENT_PANEL_SCROLLER_SELECTOR)
    return scroller instanceof HTMLElement ? scroller : ownPane
  }

  // In a portal (modal): can't walk up. Prefer selected pane, then any pane,
  // then the nearest scrollable ancestor.
  const selectedScroller = document.querySelector(SELECTED_PANE_SCROLLER_SELECTOR)
  if (selectedScroller instanceof HTMLElement) return selectedScroller

  const scroller = document.querySelector(DOCUMENT_PANEL_SCROLLER_SELECTOR)
  if (scroller instanceof HTMLElement) return scroller

  return getScrollParent(node)
}

// In-place anchor; also the reference for locating the document pane.
const FullscreenRoot = styled.div`
  position: relative;
`

// Portaled container, pinned to the pane bounds via inline style. Draws the
// top/bottom divider (flush with the pane sides).
const FullscreenOverlay = styled.div(({theme}) => {
  // oxlint-disable-next-line typescript/no-deprecated
  const {input} = theme.sanity
  // oxlint-disable-next-line typescript/no-deprecated
  const borderColor = theme.sanity.color.input.default.enabled.border

  return css`
    box-sizing: border-box;
    overflow: hidden;
    border-top: ${input.border.width}px solid ${borderColor};
    border-bottom: ${input.border.width}px solid ${borderColor};
  `
})

const ToggleButtonBox = styled(Box)`
  position: absolute;
  top: 0;
  right: 0;
  z-index: 2;
`

/** Editor container; fills its parent when `$fullscreen`. */
export const EditorContainer = styled(Card)<{$fullscreen: boolean}>(({theme, $fullscreen}) => {
  // TODO: when upgrading to @sanity/ui@4 start using the new tokens
  // oxlint-disable-next-line typescript/no-deprecated
  const {focusRing, input} = theme.sanity
  // oxlint-disable-next-line typescript/no-deprecated
  const base = theme.sanity.color.base
  // oxlint-disable-next-line typescript/no-deprecated
  const color = theme.sanity.color.input
  const border = {
    color: color.default.enabled.border,
    width: input.border.width,
  }

  return css`
    --input-box-shadow: ${focusRingBorderStyle(border)};

    box-shadow: var(--input-box-shadow);
    height: ${EDITOR_HEIGHT}px;
    min-height: 80px;
    overflow-y: auto;
    position: relative;
    resize: vertical;
    z-index: 0;

    & > .cm-theme {
      height: 100%;
    }

    &:focus-within {
      --input-box-shadow: ${focusRingStyle({
        base,
        border,
        focusRing,
      })};
    }

    ${$fullscreen &&
    css`
      height: 100%;
      border-radius: 0;
      resize: none;
      background-color: ${base.bg};
      /* Divider drawn on the overlay so the sides sit flush with the pane */
      box-shadow: none;
    `}
  `
})

interface FullscreenEditorProps {
  /** When false, renders children without the expand button. */
  enabled: boolean
  children: (state: {isFullscreen: boolean}) => ReactNode
}

/** Wraps the editor with an "Expand editor" toggle that fills the document pane. */
export function FullscreenEditor({enabled, children}: FullscreenEditorProps): React.JSX.Element {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  // Overlay node in state too — used as the tooltip's boundary element.
  const [overlayElement, setOverlayElement] = useState<HTMLDivElement | null>(null)
  const setOverlayRef = useCallback((node: HTMLDivElement | null) => {
    overlayRef.current = node
    setOverlayElement(node)
  }, [])
  // Document pane bounds, used to size the overlay.
  const [paneRect, setPaneRect] = useState<{
    top: number
    left: number
    width: number
    height: number
  } | null>(null)
  // Editor height captured when expanding, so the in-place placeholder keeps the
  // surrounding fields from shifting while the editor is portaled away.
  const [placeholderHeight, setPlaceholderHeight] = useState(EDITOR_HEIGHT)

  // Only treat as fullscreen once the pane is measured.
  const showFullscreen = isFullscreen && paneRect !== null

  // Reset paneRect alongside isFullscreen so the next expand re-measures (rather
  // than rendering at stale coordinates). Done here, not in the effect cleanup,
  // to avoid a state update when the component unmounts while expanded.
  const collapse = useCallback(() => {
    setPaneRect(null)
    setIsFullscreen(false)
  }, [])

  const handleToggle = useCallback(() => {
    if (isFullscreen) {
      collapse()
      return
    }
    setPlaceholderHeight(rootRef.current?.offsetHeight ?? EDITOR_HEIGHT)
    setIsFullscreen(true)
  }, [isFullscreen, collapse])

  // Exit on Escape, scoped to the overlay so other Studio UI keeps its own
  // handling; stopImmediatePropagation keeps a surrounding modal open.
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        event.nativeEvent.stopImmediatePropagation()
        collapse()
      }
    },
    [collapse],
  )

  // Track the pane bounds while fullscreen so the overlay fills the pane.
  useEffect(() => {
    if (!isFullscreen) return undefined

    // Fall back to the viewport if the pane can't be found.
    const paneElement = getDocumentPaneElement(rootRef.current)

    const update = () => {
      const {top, left, width, height} = paneElement
        ? paneElement.getBoundingClientRect()
        : {top: 0, left: 0, width: window.innerWidth, height: window.innerHeight}
      // Skip unchanged bounds so scroll events don't cause needless re-renders.
      setPaneRect((prev) =>
        prev &&
        prev.top === top &&
        prev.left === left &&
        prev.width === width &&
        prev.height === height
          ? prev
          : {top, left, width, height},
      )
    }

    // Defer so we don't setState synchronously.
    const raf = requestAnimationFrame(update)
    let resizeObserver: ResizeObserver | undefined
    if (paneElement) {
      resizeObserver = new ResizeObserver(update)
      resizeObserver.observe(paneElement)
    }
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)

    return () => {
      cancelAnimationFrame(raf)
      resizeObserver?.disconnect()
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [isFullscreen])

  // Portaling drops focus to <body>; move it into the overlay so Escape and
  // typing work.
  useEffect(() => {
    if (!showFullscreen) return undefined

    const raf = requestAnimationFrame(() => {
      const overlay = overlayRef.current
      if (!overlay) return
      const editable = overlay.querySelector<HTMLElement>('.cm-content')
      ;(editable ?? overlay).focus()
    })

    return () => cancelAnimationFrame(raf)
  }, [showFullscreen])

  const toggleButton = enabled && (
    <ToggleButtonBox padding={1}>
      <Tooltip
        animate
        arrow={false}
        // Constrain to the overlay so a surrounding modal's boundary doesn't
        // shift the tooltip; falls back to the viewport when not expanded.
        boundaryElement={overlayElement}
        content={<Text size={1}>{showFullscreen ? 'Collapse editor' : 'Expand editor'}</Text>}
        delay={TOOLTIP_DELAY}
        placement="bottom"
        portal
      >
        <Button
          aria-label={showFullscreen ? 'Collapse editor' : 'Expand editor'}
          icon={showFullscreen ? CollapseIcon : ExpandIcon}
          mode="ghost"
          onClick={handleToggle}
          padding={2}
        />
      </Tooltip>
    </ToggleButtonBox>
  )

  const fullscreenStyle: CSSProperties | undefined =
    showFullscreen && paneRect
      ? {
          position: 'fixed',
          top: paneRect.top,
          left: paneRect.left,
          width: paneRect.width,
          height: paneRect.height,
        }
      : undefined

  return (
    <FullscreenRoot ref={rootRef}>
      {showFullscreen ? (
        // Hold the editor's spot in the form layout so sibling fields and the
        // document scroll position don't shift while it's portaled away.
        <>
          <div aria-hidden style={{height: placeholderHeight}} />
          {/* Portal out of any modal so position:fixed is viewport-relative;
              Layer stacks it above the modal. */}
          <Portal>
            <Layer>
              <FullscreenOverlay
                onKeyDown={handleKeyDown}
                ref={setOverlayRef}
                style={fullscreenStyle}
                tabIndex={-1}
              >
                {toggleButton}
                {children({isFullscreen: showFullscreen})}
              </FullscreenOverlay>
            </Layer>
          </Portal>
        </>
      ) : (
        <>
          {toggleButton}
          {children({isFullscreen: showFullscreen})}
        </>
      )}
    </FullscreenRoot>
  )
}
