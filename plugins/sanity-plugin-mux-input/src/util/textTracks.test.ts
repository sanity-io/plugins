import {describe, expect, test} from 'vitest'

import {extractErrorMessage} from './textTracks'

/** An error shaped like the client's, with the parsed response body on `response.body`. */
const withBody = (message: string, body: unknown) =>
  Object.assign(new Error(message), {response: {statusCode: 400, body}})

describe('extractErrorMessage', () => {
  test("shows Mux's own message first", () => {
    const error = withBody('Bad Request - Invalid input', {
      message: 'Invalid input',
      code: 'mux_request_rejected',
      mux: {type: 'invalid_parameters', message: 'Invalid language code (xx-YY)'},
    })
    expect(extractErrorMessage(error)).toBe('Invalid language code (xx-YY)')
  })

  test("falls back to the API's message, then the error's", () => {
    expect(
      extractErrorMessage(withBody('Bad Request - Track not found', {message: 'Track not found'})),
    ).toBe('Track not found')
    expect(extractErrorMessage(new Error('Request failed'))).toBe('Request failed')
    expect(extractErrorMessage('Something broke')).toBe('Something broke')
  })

  test('shows a plain message with parentheses whole', () => {
    expect(extractErrorMessage(withBody('x', {message: 'Invalid language code (xx-YY)'}))).toBe(
      'Invalid language code (xx-YY)',
    )
    expect(extractErrorMessage(new Error('Invalid language code (xx-YY)'))).toBe(
      'Invalid language code (xx-YY)',
    )
  })

  test("unwraps Mux's message from older APIs", () => {
    const fromBody = withBody('Bad Request - api.mux.com responded with 400 (Invalid input)', {
      message: 'api.mux.com responded with 400 (Invalid input)',
    })
    expect(extractErrorMessage(fromBody)).toBe('Invalid input')
    expect(extractErrorMessage(new Error('api.mux.com responded with 404 (Track not found)'))).toBe(
      'Track not found',
    )
  })

  test('uses the default message when there is none', () => {
    expect(extractErrorMessage(undefined, 'Failed to add caption track')).toBe(
      'Failed to add caption track',
    )
    expect(extractErrorMessage(withBody('', {}))).toBe('Failed to process request')
  })
})
