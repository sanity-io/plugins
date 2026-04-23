/// <reference types="@testing-library/jest-dom" />
import {cleanup, render, screen} from '@testing-library/react'
import type {FunctionComponent} from 'react'
import type {InputProps} from 'sanity'
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

    if (
      !('components' in schemaType) ||
      !schemaType.components ||
      !('input' in schemaType.components)
    ) {
      throw new Error('Expected components.input to be set by the registry')
    }
    const rawInput = schemaType.components.input
    if (typeof rawInput !== 'function') {
      throw new Error('Expected components.input to be a function')
    }
    // oxlint-disable-next-line no-unsafe-type-assertion -- the registry installs a FunctionComponent<InputProps> wrapper on every preset it produces
    const telemetryWrapper = rawInput as unknown as FunctionComponent<InputProps>

    // The registry must not replace the user's input with the telemetry wrapper —
    // it must render the user's input inside the wrapper so both behaviours run.
    expect(telemetryWrapper).not.toBe(userInput)

    const renderDefault = vi.fn(() => <div data-testid="default-input">Default input</div>)

    // oxlint-disable-next-line no-unsafe-type-assertion -- minimal stub of InputProps for render test
    const props = {renderDefault} as unknown as InputProps

    const TelemetryWrapper = telemetryWrapper
    render(<TelemetryWrapper {...props} />)

    expect(userInput).toHaveBeenCalledOnce()
    expect(screen.getByTestId('user-input')).toBeInTheDocument()
    expect(screen.queryByTestId('default-input')).not.toBeInTheDocument()
  })

  test('when no user components.input is provided, the telemetry wrapper falls back to renderDefault', ({
    registry,
  }) => {
    const schemaType = registry.defineLink({name: 'myLink'})

    if (
      !('components' in schemaType) ||
      !schemaType.components ||
      !('input' in schemaType.components)
    ) {
      throw new Error('Expected components.input to be set by the registry')
    }
    const rawInput = schemaType.components.input
    if (typeof rawInput !== 'function') {
      throw new Error('Expected components.input to be a function')
    }
    // oxlint-disable-next-line no-unsafe-type-assertion -- the registry installs a FunctionComponent<InputProps> wrapper on every preset it produces
    const telemetryWrapper = rawInput as unknown as FunctionComponent<InputProps>

    const renderDefault = vi.fn(() => <div data-testid="default-input">Default input</div>)

    // oxlint-disable-next-line no-unsafe-type-assertion -- minimal stub of InputProps for render test
    const props = {renderDefault} as unknown as InputProps

    const TelemetryWrapper = telemetryWrapper
    render(<TelemetryWrapper {...props} />)

    expect(renderDefault).toHaveBeenCalled()
    expect(screen.getByTestId('default-input')).toBeInTheDocument()
  })
})
