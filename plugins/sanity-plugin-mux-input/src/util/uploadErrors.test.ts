import {describe, expect, test} from 'vitest'

import {isRetryablePollError, toUploadError} from './uploadErrors'

const withStatus = (message: string, statusCode: number) =>
  Object.assign(new Error(message), {statusCode})

describe('toUploadError', () => {
  test('maps Mux rejecting the credentials on a file upload (400)', () => {
    const error = withStatus('api.mux.com responded with 401 (Unauthorized request)', 400)
    expect(toUploadError(error)).toEqual(new Error('Invalid credentials'))
  })

  test('maps Mux rejecting the credentials on a URL upload (502)', () => {
    const error = withStatus('\n      api.mux.com responded with 401 (Unauthorized request)', 502)
    expect(toUploadError(error)).toEqual(new Error('Invalid credentials'))
  })

  test('maps missing credentials', () => {
    const error = withStatus('No MUX secrets found in this dataset (production)', 401)
    expect(toUploadError(error)).toEqual(new Error('Invalid credentials'))
  })

  test('leaves other errors alone', () => {
    const error = withStatus('api.mux.com responded with 400 (Invalid input)', 400)
    expect(toUploadError(error)).toBe(error)
  })
})

describe('isRetryablePollError', () => {
  test.each([
    ['network error', new Error('Request failed'), true],
    ['404', withStatus('Could not find asset', 404), true],
    ['502', withStatus('Bad gateway', 502), true],
    ['400', withStatus('Bad request', 400), false],
    ['401', withStatus('Unauthorized', 401), false],
    ['403', withStatus('Forbidden', 403), false],
  ])('%s', (_name, error, expected) => {
    expect(isRetryablePollError(error)).toBe(expected)
  })
})
