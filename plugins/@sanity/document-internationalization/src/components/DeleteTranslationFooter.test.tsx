import {cleanup, fireEvent, render, screen} from '@testing-library/react'
import {afterEach, describe, expect, test, vi} from 'vitest'

import {ThemeWrapper} from '../test/component-helpers'
import DeleteTranslationFooter from './DeleteTranslationFooter'

describe('DeleteTranslationFooter', () => {
  afterEach(() => {
    cleanup()
  })

  test('shows Unset translation reference when metadata translations exist', () => {
    const onClose = vi.fn()
    const onProceed = vi.fn()

    render(
      <DeleteTranslationFooter
        translations={[{_id: 'meta-1'}]}
        onClose={onClose}
        onProceed={onProceed}
      />,
      {wrapper: ThemeWrapper},
    )

    expect(screen.getByRole('button', {name: 'Unset translation reference'})).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: 'Cancel'}))
    expect(onClose).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', {name: 'Unset translation reference'}))
    expect(onProceed).toHaveBeenCalled()
  })

  test('shows Delete document when there are no translation references', () => {
    render(<DeleteTranslationFooter translations={[]} onClose={vi.fn()} onProceed={vi.fn()} />, {
      wrapper: ThemeWrapper,
    })

    expect(screen.getByRole('button', {name: 'Delete document'})).toBeInTheDocument()
  })
})
