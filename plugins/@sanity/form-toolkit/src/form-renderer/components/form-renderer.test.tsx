// @vitest-environment jsdom
import {cleanup, fireEvent, render} from '@testing-library/react'
import {afterEach, describe, expect, test, vi} from 'vitest'

import {FormRenderer} from './form-renderer'
import type {FieldState, FormDataProps} from './types'

const formData: FormDataProps = {
  title: 'Contact',
  id: {current: 'contact'},
  fields: [
    {type: 'text', name: 'firstName', label: 'First name'},
    {type: 'textarea', name: 'message', label: 'Message'},
  ],
}

afterEach(() => {
  cleanup()
})

describe('FormRenderer', () => {
  test('renders interactive (uncontrolled) inputs when no getFieldState is provided', () => {
    const {container} = render(<FormRenderer formData={formData} />)

    const input = container.querySelector('input[name="firstName"]')
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('Expected a text input for "firstName"')
    }
    // The previous default returned a no-op onChange, which locked the controlled
    // input. As an uncontrolled input the typed value now sticks.
    fireEvent.change(input, {target: {value: 'Ada'}})
    expect(input.value).toBe('Ada')

    const textarea = container.querySelector('textarea[name="message"]')
    if (!(textarea instanceof HTMLTextAreaElement)) {
      throw new Error('Expected a textarea for "message"')
    }
    fireEvent.change(textarea, {target: {value: 'Hello there'}})
    expect(textarea.value).toBe('Hello there')
  })

  test('supports controlled inputs via getFieldState/onChange', () => {
    const onChange = vi.fn()
    const getFieldState = (fieldName: string): FieldState => ({
      value: fieldName === 'firstName' ? 'Grace' : '',
      onChange,
    })

    const {container} = render(<FormRenderer formData={formData} getFieldState={getFieldState} />)

    const input = container.querySelector('input[name="firstName"]')
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('Expected a text input for "firstName"')
    }
    expect(input.value).toBe('Grace')

    fireEvent.change(input, {target: {value: 'Ada'}})
    expect(onChange).toHaveBeenCalledWith('Ada')
  })

  test('falls back to field.name for the React key when _key is missing', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<FormRenderer formData={formData} />)

    const duplicateKeyWarnings = errorSpy.mock.calls.filter((args) =>
      args.some((arg) => typeof arg === 'string' && arg.includes('same key')),
    )
    expect(duplicateKeyWarnings).toEqual([])

    errorSpy.mockRestore()
  })
})
