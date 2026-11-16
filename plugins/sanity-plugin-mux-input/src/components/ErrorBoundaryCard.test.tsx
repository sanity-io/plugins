// @vitest-environment jsdom
import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {cleanup, fireEvent, render, screen} from '@testing-library/react'
import type {ObjectSchemaType} from 'sanity'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import ErrorBoundaryCard from './ErrorBoundaryCard'

const pushToast = vi.fn()

vi.mock('@sanity/ui/toast', () => ({
  useToast: () => ({push: pushToast}),
}))

const theme = buildTheme()
const schemaType = {title: 'Video'} as ObjectSchemaType

let shouldThrow = true

function Child() {
  if (shouldThrow) {
    throw new Error('Mux is unreachable')
  }
  return <p>Video input</p>
}

beforeEach(() => {
  shouldThrow = true
  pushToast.mockClear()
  for (const method of ['error', 'group', 'groupCollapsed', 'groupEnd', 'log'] as const) {
    vi.spyOn(console, method).mockImplementation(() => {})
  }
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('ErrorBoundaryCard', () => {
  test('shows the crash card and a toast when a child throws, and recovers on retry', () => {
    render(
      <ThemeProvider theme={theme}>
        <ErrorBoundaryCard schemaType={schemaType}>
          <Child />
        </ErrorBoundaryCard>
      </ThemeProvider>,
    )

    expect(screen.getByRole('heading', {level: 1}).textContent).toContain('plugin crashed')
    expect(screen.getByText('Mux is unreachable')).toBeTruthy()
    expect(pushToast).toHaveBeenCalledWith(
      expect.objectContaining({status: 'error', title: 'Plugin crashed'}),
    )

    shouldThrow = false
    fireEvent.click(screen.getByRole('button', {name: 'Retry'}))

    expect(screen.getByText('Video input')).toBeTruthy()
  })
})
