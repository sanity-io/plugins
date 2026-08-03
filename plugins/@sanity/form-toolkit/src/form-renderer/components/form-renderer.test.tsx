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

  test('applies options.defaultValue on uncontrolled text and textarea fields', () => {
    const formWithDefaults: FormDataProps = {
      title: 'Contact',
      id: {current: 'contact'},
      fields: [
        {
          type: 'text',
          name: 'firstName',
          label: 'First name',
          options: {defaultValue: 'Ada'},
        },
        {
          type: 'textarea',
          name: 'message',
          label: 'Message',
          options: {defaultValue: 'Hello there'},
        },
      ],
    }

    const {container} = render(<FormRenderer formData={formWithDefaults} />)

    const input = container.querySelector('input[name="firstName"]')
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('Expected a text input for "firstName"')
    }
    expect(input.value).toBe('Ada')

    const textarea = container.querySelector('textarea[name="message"]')
    if (!(textarea instanceof HTMLTextAreaElement)) {
      throw new Error('Expected a textarea for "message"')
    }
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

  test('controlled fields ignore options.defaultValue when form state is empty', () => {
    const onChange = vi.fn()
    const formWithDefaults: FormDataProps = {
      title: 'Contact',
      id: {current: 'contact'},
      fields: [
        {
          type: 'text',
          name: 'firstName',
          label: 'First name',
          options: {defaultValue: 'Ada'},
        },
        {
          type: 'textarea',
          name: 'message',
          label: 'Message',
          options: {defaultValue: 'Hello there'},
        },
      ],
    }
    const getFieldState = (): FieldState => ({
      value: undefined,
      onChange,
    })

    const {container} = render(
      <FormRenderer formData={formWithDefaults} getFieldState={getFieldState} />,
    )

    const input = container.querySelector('input[name="firstName"]')
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('Expected a text input for "firstName"')
    }
    expect(input.value).toBe('')

    const textarea = container.querySelector('textarea[name="message"]')
    if (!(textarea instanceof HTMLTextAreaElement)) {
      throw new Error('Expected a textarea for "message"')
    }
    expect(textarea.value).toBe('')
  })

  test('falls back to field.name for the React key when _key is missing', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<FormRenderer formData={formData} />)

    const keyWarnings = errorSpy.mock.calls.filter((args) =>
      args.some(
        (arg) =>
          typeof arg === 'string' &&
          // React warns differently for missing vs duplicate keys
          (arg.includes('same key') ||
            arg.includes('unique "key" prop') ||
            arg.includes("unique 'key' prop")),
      ),
    )
    expect(keyWarnings).toEqual([])

    errorSpy.mockRestore()
  })
})
