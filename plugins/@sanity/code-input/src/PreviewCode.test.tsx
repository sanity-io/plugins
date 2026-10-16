import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {cleanup, render, screen} from '@testing-library/react'
import {afterEach, describe, expect, test} from 'vitest'

import {PreviewCode, type PreviewCodeProps} from './PreviewCode'
import type {CodeSchemaType} from './types'

// jsdom has no matchMedia; @sanity/ui's ThemeProvider queries it for the
// prefers-color-scheme lookup. The shape assertions are test-environment
// shims, not production narrowing.
// oxlint-disable no-unsafe-type-assertion
window.matchMedia ??= ((query: string) =>
  ({
    addEventListener: () => {},
    addListener: () => {},
    dispatchEvent: () => false,
    matches: false,
    media: query,
    onchange: null,
    removeEventListener: () => {},
    removeListener: () => {},
  }) as unknown as MediaQueryList) as typeof window.matchMedia

// ObjectSchemaType requires many fields this preview never reads.
const schemaType = {
  name: 'code',
  options: {},
} as CodeSchemaType
// oxlint-enable no-unsafe-type-assertion

const theme = buildTheme()

function renderDefault() {
  return <span />
}

/**
 * Studio's portable-text inline object is a `span[data-as="span"][data-ui="Card"]`
 * with `height: calc(1em - 1px)`. Preview padding paints outside that box and
 * overlaps the surrounding text.
 */
const inlineChipStyle = {
  boxSizing: 'content-box' as const,
  display: 'inline-flex',
  fontSize: '16px',
  height: 'calc(1em - 1px)',
  lineHeight: 0,
  padding: '2px',
}

function renderInlinePreview(props: Partial<PreviewCodeProps> = {}) {
  return render(
    <ThemeProvider theme={theme}>
      <span data-as="span" data-testid="inline-chip" data-ui="Card" style={inlineChipStyle}>
        <PreviewCode
          layout="inline"
          renderDefault={renderDefault}
          schemaType={schemaType}
          {...props}
        />
      </span>
    </ThemeProvider>,
  )
}

describe('PreviewCode inline layout', () => {
  afterEach(() => {
    cleanup()
  })

  test('does not render a padded card inside the inline object chip', () => {
    renderInlinePreview({
      selection: {
        code: 'const answer = 42',
        filename: 'index.js',
        language: 'javascript',
      },
      title: 'index.js',
    })

    const chip = screen.getByTestId('inline-chip')
    // The preview's own card is the padded block. The chip replica is the only
    // card that should remain.
    const previewCards = [...chip.querySelectorAll('[data-ui="Card"]')].filter(
      (element) => element !== chip,
    )
    expect(previewCards).toEqual([])

    const label = screen.getByTestId('inline-code-preview')
    expect(label.textContent).toBe('const answer = 42')
    expect(label.querySelector('.cm-editor')).toBeNull()
    const style = getComputedStyle(label)
    expect(style.paddingTop).toBe('0px')
    expect(style.paddingBottom).toBe('0px')
    expect(style.whiteSpace).toBe('nowrap')
  })

  test('falls back to UNKNOWN when the first line and language are empty', () => {
    renderInlinePreview({
      selection: {code: '\n  const answer = 42', filename: 'index.js'},
      title: 'index.js',
    })

    expect(screen.getByTestId('inline-code-preview').textContent).toBe('UNKNOWN')
  })

  test('falls back to the language when the first line is empty', () => {
    renderInlinePreview({
      selection: {
        code: '   \nconst answer = 42',
        filename: 'index.js',
        language: 'javascript',
      },
      title: 'index.js',
    })

    expect(screen.getByTestId('inline-code-preview').textContent).toBe('JAVASCRIPT')
  })

  test('uses the first code line instead of the language or filename', () => {
    renderInlinePreview({
      selection: {
        code: 'const answer = 42\nreturn answer',
        filename: 'index.js',
        language: 'javascript',
      },
      title: 'JAVASCRIPT',
    })

    expect(screen.getByTestId('inline-code-preview').textContent).toBe('const answer = 42')
  })

  test('caps the first code line at 20 characters', () => {
    renderInlinePreview({
      selection: {
        code: 'abcdefghijklmnopqrstuvwxyz',
        language: 'javascript',
      },
      title: 'JAVASCRIPT',
    })

    const label = screen.getByTestId('inline-code-preview').textContent
    expect(label).toBe('abcdefghijklmnopqrs…')
    expect(label).toHaveLength(20)
  })

  test('leaves a 20 character first line unchanged', () => {
    renderInlinePreview({
      selection: {code: 'abcdefghijklmnopqrst'},
    })

    expect(screen.getByTestId('inline-code-preview').textContent).toBe('abcdefghijklmnopqrst')
  })

  test('keeps the padded code card for block previews', () => {
    render(
      <ThemeProvider theme={theme}>
        <PreviewCode
          layout="block"
          renderDefault={renderDefault}
          schemaType={schemaType}
          selection={{code: 'const answer = 42', filename: 'index.js', language: 'javascript'}}
          title="index.js"
        />
      </ThemeProvider>,
    )

    expect(screen.getByText('index.js').closest('[data-ui="Card"]')).toBeTruthy()
  })
})
