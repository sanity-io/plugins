import {CollapseIcon, ExpandIcon} from '@sanity/icons'
import {Box, Button, Card, Layer, Portal, Stack, Text, Tooltip} from '@sanity/ui'
import {type CSSProperties, Suspense, useCallback, useEffect, useRef, useState} from 'react'
import {
  MemberField,
  type ObjectInputProps,
  type RenderInputCallback,
  set,
  setIfMissing,
  unset,
} from 'sanity'
import {css, styled} from 'styled-components'

import {CodeMirrorProxy, useMounted} from './codemirror/useCodeMirror'
import {useLanguageMode} from './codemirror/useLanguageMode'
import {PATH_CODE} from './config'
import {LanguageField} from './LanguageField'
import type {CodeInputValue, CodeSchemaType} from './types'
import {focusRingBorderStyle, focusRingStyle} from './ui/focusRingStyle'
import {useFieldMember} from './useFieldMember'

export type {CodeInputLanguage, CodeInputValue} from './types'

/**
 * @public
 */
export interface CodeInputProps extends ObjectInputProps<CodeInputValue, CodeSchemaType> {}

// Match the Studio's tooltip timing (see TOOLTIP_DELAY_PROPS in `sanity`)
const TOOLTIP_DELAY = {open: 400}

// Studio DOM markers for the document pane and its scrolling content area
const DOCUMENT_PANE_SELECTOR = '[data-testid="document-pane"]'
const DOCUMENT_PANEL_SCROLLER_SELECTOR = '[data-testid="document-panel-scroller"]'
// The currently selected pane, used to disambiguate split-view layouts
const SELECTED_PANE_SCROLLER_SELECTOR = `${DOCUMENT_PANE_SELECTOR}[data-pane-selected="true"] ${DOCUMENT_PANEL_SCROLLER_SELECTOR}`

// Finds the nearest scrollable ancestor — fallback for locating the pane.
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

// Resolves the document panel's scroll container so the fullscreen overlay fills
// the document pane — not the whole viewport, and not a surrounding dialog when
// the field is edited inside a modal (which is rendered in a portal).
function getDocumentPaneElement(node: HTMLElement | null): HTMLElement | null {
  if (!node) return null

  const ownPane = node.closest(DOCUMENT_PANE_SELECTOR)
  if (ownPane instanceof HTMLElement) {
    const scroller = ownPane.querySelector(DOCUMENT_PANEL_SCROLLER_SELECTOR)
    return scroller instanceof HTMLElement ? scroller : ownPane
  }

  // Field is rendered in a portal (e.g. a modal), so we can't walk up to the
  // pane. Prefer the selected pane (disambiguates split-view layouts), then any
  // document panel, then the nearest scrollable ancestor.
  const selectedScroller = document.querySelector(SELECTED_PANE_SCROLLER_SELECTOR)
  if (selectedScroller instanceof HTMLElement) return selectedScroller

  const scroller = document.querySelector(DOCUMENT_PANEL_SCROLLER_SELECTOR)
  if (scroller instanceof HTMLElement) return scroller

  return getScrollParent(node)
}

// In-place anchor for the editor; also the reference point for locating the
// surrounding document pane.
const FullscreenRoot = styled.div`
  position: relative;
`

// The portaled fullscreen container, pinned (via inline style) to the document
// pane bounds. Provides the positioning context for the toggle button and draws
// the top/bottom divider (flush with the pane on the sides).
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

const EditorContainer = styled(Card)<{$fullscreen: boolean}>(({theme, $fullscreen}) => {
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
    height: 250px;
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
      /* No editor border in fullscreen — the top/bottom divider is drawn on the
         FullscreenOverlay so it sits flush against the pane on the sides */
      box-shadow: none;
    `}
  `
})

/** @public */
export function CodeInput(props: CodeInputProps): React.JSX.Element {
  const {
    members,
    elementProps,
    onChange,
    readOnly,
    renderField,
    renderInput,
    renderItem,
    renderPreview,
    schemaType: type,
    value,
    onPathFocus,
  } = props

  const languageFieldMember = useFieldMember(members, 'language')
  const filenameMember = useFieldMember(members, 'filename')
  const codeFieldMember = useFieldMember(members, 'code')

  const handleCodeFocus = useCallback(() => {
    onPathFocus(PATH_CODE)
  }, [onPathFocus])

  const onHighlightChange = useCallback(
    (lines: number[]) => onChange(set(lines, ['highlightedLines'])),
    [onChange],
  )

  const handleCodeChange = useCallback(
    (code: string) => {
      const path = PATH_CODE
      const fixedLanguage = type.options?.language

      onChange([
        setIfMissing({_type: type.name, language: fixedLanguage}),
        code ? set(code, path) : unset(path),
      ])
    },
    [onChange, type],
  )
  const {languages, language, languageMode} = useLanguageMode(props.schemaType, props.value)

  const mounted = useMounted()

  const fullscreenEnabled = !type.options?.disableFullscreen
  const [isFullscreen, setIsFullscreen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  // Bounds of the surrounding document pane, used to size the fullscreen overlay
  const [paneRect, setPaneRect] = useState<{
    top: number
    left: number
    width: number
    height: number
  } | null>(null)

  // Only treat as fullscreen once we've measured the pane bounds
  const showFullscreen = isFullscreen && paneRect !== null

  const handleToggleFullscreen = useCallback(() => setIsFullscreen((current) => !current), [])

  // Exit fullscreen on Escape. Scoped to the overlay (rather than a global
  // listener) so it only fires when focus is inside the expanded editor —
  // other Studio UI keeps its own Escape handling. stopImmediatePropagation on
  // the native event also prevents a surrounding dialog (when the field is
  // edited in a modal) from closing alongside the editor.
  const handleOverlayKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      event.nativeEvent.stopImmediatePropagation()
      setIsFullscreen(false)
    }
  }, [])

  // While fullscreen, track the document pane's bounds so the overlay fills the
  // pane (not the whole viewport, which would cover the Studio chrome).
  useEffect(() => {
    if (!isFullscreen) return undefined

    // Fall back to the viewport if the pane can't be located, so the editor
    // still expands rather than getting stuck in an in-between state.
    const paneElement = getDocumentPaneElement(rootRef.current)

    const update = () => {
      const {top, left, width, height} = paneElement
        ? paneElement.getBoundingClientRect()
        : {top: 0, left: 0, width: window.innerWidth, height: window.innerHeight}
      // Bail out if the bounds are unchanged so frequent scroll events (e.g.
      // scrolling within the editor) don't trigger needless re-renders.
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

    // Defer the initial measurement so we don't call setState synchronously
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
      // Clear the cached bounds on collapse so the next expand re-measures
      // instead of briefly rendering at stale coordinates.
      setPaneRect(null)
    }
  }, [isFullscreen])

  // Portaling the overlay drops keyboard focus to <body>, which would stop the
  // overlay's Escape handler from firing. Move focus into the overlay (prefer
  // the editor) once it's shown so Escape collapses it and typing works.
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

  const renderCodeInput: RenderInputCallback = useCallback(
    (inputProps) => {
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

      const toggleButton = fullscreenEnabled && (
        <ToggleButtonBox padding={1}>
          <Tooltip
            animate
            arrow={false}
            content={<Text size={1}>{showFullscreen ? 'Collapse editor' : 'Expand editor'}</Text>}
            delay={TOOLTIP_DELAY}
            placement="left"
            portal
          >
            <Button
              aria-label={showFullscreen ? 'Collapse editor' : 'Expand editor'}
              icon={showFullscreen ? CollapseIcon : ExpandIcon}
              mode="ghost"
              onClick={handleToggleFullscreen}
              padding={2}
            />
          </Tooltip>
        </ToggleButtonBox>
      )

      const editor = (
        <EditorContainer
          $fullscreen={showFullscreen}
          border={!showFullscreen}
          overflow="hidden"
          radius={1}
          sizing="border"
          readOnly={readOnly}
        >
          {mounted && (
            <Suspense
              fallback={
                <Box padding={3}>
                  <Text>Loading code editor...</Text>
                </Box>
              }
            >
              <CodeMirrorProxy
                languageMode={languageMode}
                onChange={handleCodeChange}
                // oxlint-disable-next-line no-unsafe-type-assertion - fix later
                value={inputProps.value as string}
                highlightLines={value?.highlightedLines}
                onHighlightChange={onHighlightChange}
                readOnly={readOnly}
                onFocus={handleCodeFocus}
                onBlur={elementProps.onBlur}
              />
            </Suspense>
          )}
        </EditorContainer>
      )

      return (
        <FullscreenRoot ref={rootRef}>
          {showFullscreen ? (
            // Portal out of any surrounding dialog so position:fixed is
            // viewport-relative, and Layer keeps it stacked above the dialog.
            <Portal>
              <Layer>
                <FullscreenOverlay
                  onKeyDown={handleOverlayKeyDown}
                  ref={overlayRef}
                  style={fullscreenStyle}
                  tabIndex={-1}
                >
                  {toggleButton}
                  {editor}
                </FullscreenOverlay>
              </Layer>
            </Portal>
          ) : (
            <>
              {toggleButton}
              {editor}
            </>
          )}
        </FullscreenRoot>
      )
    },
    [
      showFullscreen,
      paneRect,
      fullscreenEnabled,
      handleToggleFullscreen,
      handleOverlayKeyDown,
      readOnly,
      mounted,
      languageMode,
      handleCodeChange,
      value?.highlightedLines,
      onHighlightChange,
      handleCodeFocus,
      elementProps.onBlur,
    ],
  )

  return (
    <Stack gap={4}>
      {languageFieldMember && (
        <LanguageField
          member={languageFieldMember}
          language={language}
          languages={languages}
          renderField={renderField}
          renderItem={renderItem}
          renderInput={renderInput}
          renderPreview={renderPreview}
        />
      )}

      {type.options?.withFilename && filenameMember && (
        <MemberField
          member={filenameMember}
          renderItem={renderItem}
          renderField={renderField}
          renderInput={renderInput}
          renderPreview={renderPreview}
        />
      )}

      {codeFieldMember && (
        <MemberField
          member={codeFieldMember}
          renderInput={renderCodeInput}
          renderItem={renderItem}
          renderField={renderField}
          renderPreview={renderPreview}
        />
      )}
    </Stack>
  )
}
