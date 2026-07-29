import {cleanup, render, screen} from '@testing-library/react'
import {afterEach, describe, expect, test} from 'vitest'

import {ThemeWrapper} from '../test/component-helpers'
import Feedback from './Feedback'

afterEach(() => {
  cleanup()
})

describe('Feedback', () => {
  test('renders caution card explaining required languages shape', () => {
    render(<Feedback />, {wrapper: ThemeWrapper})

    expect(screen.getByText(/array of language objects must be passed/i)).toBeInTheDocument()
    expect(screen.getByText(/"id"/)).toBeInTheDocument()
    expect(screen.getByText(/"title"/)).toBeInTheDocument()
    // Example JSON is shown in a Code block
    expect(screen.getByText(/English/)).toBeInTheDocument()
    expect(screen.getByText(/Norsk/)).toBeInTheDocument()
  })
})
