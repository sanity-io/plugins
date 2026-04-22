import {cleanup, render, screen} from '@testing-library/react'
import {afterEach, describe, expect, vi} from 'vitest'

import {test} from './test/fixtures'

afterEach(() => {
  cleanup()
})

describe('createPresetsRegistry components.input wrapping', () => {
  test('user-provided components.input is rendered inside the telemetry wrapper', ({registry}) => {
    const userInput = vi.fn(() => <div data-testid="user-input">User input</div>)

    const schemaType = registry.defineLink({
      name: 'myLink',
      components: {input: userInput},
    })

    const telemetryWrapper = schemaType.components?.input
    if (!telemetryWrapper) {
      throw new Error('Expected components.input to be set by the registry')
    }

    // The registry must not replace the user's input with the telemetry wrapper —
    // it must render the user's input inside the wrapper so both behaviours run.
    expect(telemetryWrapper).not.toBe(userInput)

    const renderDefault = vi.fn(() => <div data-testid="default-input">Default input</div>)

    // oxlint-disable-next-line no-unsafe-type-assertion -- minimal stub of InputProps for render test
    const props = {renderDefault} as Parameters<typeof telemetryWrapper>[0]

    render(telemetryWrapper(props))

    expect(userInput).toHaveBeenCalledOnce()
    expect(screen.getByTestId('user-input')).toBeInTheDocument()
    expect(screen.queryByTestId('default-input')).not.toBeInTheDocument()
  })

  test('when no user components.input is provided, the telemetry wrapper falls back to renderDefault', ({
    registry,
  }) => {
    const schemaType = registry.defineLink({name: 'myLink'})

    const telemetryWrapper = schemaType.components?.input
    if (!telemetryWrapper) {
      throw new Error('Expected components.input to be set by the registry')
    }

    const renderDefault = vi.fn(() => <div data-testid="default-input">Default input</div>)

    // oxlint-disable-next-line no-unsafe-type-assertion -- minimal stub of InputProps for render test
    const props = {renderDefault} as Parameters<typeof telemetryWrapper>[0]

    render(telemetryWrapper(props))

    expect(renderDefault).toHaveBeenCalled()
    expect(screen.getByTestId('default-input')).toBeInTheDocument()
  })
})
