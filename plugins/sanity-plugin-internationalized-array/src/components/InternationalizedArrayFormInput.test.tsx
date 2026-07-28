/* oxlint-disable typescript-eslint/no-unsafe-type-assertion */
import {cleanup, render, screen} from '@testing-library/react'
import type {ObjectInputProps} from 'sanity'
import {afterEach, describe, expect, test, vi} from 'vitest'

import {CONFIG_DEFAULT} from '../constants'
import {ThemeWrapper} from '../test/component-helpers'
import type {PluginConfig} from '../types'
import {InternationalizedArrayFormInput} from './InternationalizedArrayFormInput'

vi.mock('./DocumentAddButtons', () => ({
  default: () => <div data-testid="document-add-buttons" />,
}))

function createProps(
  buttonLocations: ('field' | 'document')[],
): ObjectInputProps & {pluginConfig: Required<PluginConfig>} {
  return {
    pluginConfig: {
      ...CONFIG_DEFAULT,
      buttonLocations,
    },
    renderDefault: () => <div data-testid="default-input" />,
  } as unknown as ObjectInputProps & {pluginConfig: Required<PluginConfig>}
}

afterEach(() => {
  cleanup()
})

describe('InternationalizedArrayFormInput', () => {
  test('renders document add buttons when buttonLocations includes document', () => {
    render(<InternationalizedArrayFormInput {...createProps(['field', 'document'])} />, {
      wrapper: ThemeWrapper,
    })

    expect(screen.getByTestId('document-add-buttons')).toBeInTheDocument()
    expect(screen.getByTestId('default-input')).toBeInTheDocument()
  })

  test('renders only default input when document buttons are not configured', () => {
    render(<InternationalizedArrayFormInput {...createProps(['field'])} />, {
      wrapper: ThemeWrapper,
    })

    expect(screen.queryByTestId('document-add-buttons')).not.toBeInTheDocument()
    expect(screen.getByTestId('default-input')).toBeInTheDocument()
  })
})
