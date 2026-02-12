import {render, screen} from '@testing-library/react'
import {describe, expect, test} from 'vitest'

import {ThemeWrapper} from '../test/component-helpers'
import Warning from './Warning'

describe('Warning', () => {
  test('renders children text', () => {
    render(<Warning>This is a warning message</Warning>, {wrapper: ThemeWrapper})

    expect(screen.getByText('This is a warning message')).toBeInTheDocument()
  })

  test('renders with caution tone card', () => {
    const {container} = render(<Warning>Warning content</Warning>, {wrapper: ThemeWrapper})

    // The Card component with tone="caution" should be rendered
    const card = container.querySelector('[data-ui="Card"]')
    expect(card).toBeInTheDocument()
  })

  test('renders multiple children elements', () => {
    render(
      <Warning>
        <span>First part</span>
        <span>Second part</span>
      </Warning>,
      {wrapper: ThemeWrapper},
    )

    expect(screen.getByText('First part')).toBeInTheDocument()
    expect(screen.getByText('Second part')).toBeInTheDocument()
  })
})
