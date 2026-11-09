import {describe, expect, test} from 'vitest'

import {CREDENTIALS_ERROR_CODES, isUnavailableError, toUploadError} from './uploadErrors'

const withStatus = (message: string, statusCode: number) =>
  Object.assign(new Error(message), {statusCode})

/** An error shaped like the client's, with the parsed response body on `response.body`. */
const withBody = (message: string, statusCode: number, body: unknown) =>
  Object.assign(new Error(message), {statusCode, response: {statusCode, body}})

const missing = new Error(
  "Mux isn't set up for this dataset. Add your Mux credentials in the plugin settings.",
)
const rejected = new Error('Mux rejected the saved credentials. Check them in the plugin settings.')

describe('toUploadError', () => {
  test('maps Mux rejecting the credentials on a file upload (400)', () => {
    const error = withStatus('api.mux.com responded with 401 (Unauthorized request)', 400)
    expect(toUploadError(error)).toEqual(rejected)
  })

  test('maps Mux rejecting the credentials on a URL upload (502)', () => {
    const error = withStatus('\n      api.mux.com responded with 401 (Unauthorized request)', 502)
    expect(toUploadError(error)).toEqual(rejected)
  })

  test('maps missing credentials', () => {
    const error = withStatus(
      'Unauthorized - No MUX secrets found in this dataset (production)',
      401,
    )
    expect(toUploadError(error)).toEqual(missing)
  })

  test('uses the code in the response body first', () => {
    const missingByCode = withBody('Unauthorized', 401, {code: CREDENTIALS_ERROR_CODES.missing})
    expect(toUploadError(missingByCode)).toEqual(missing)

    // The code wins over a message that says otherwise
    const invalidByCode = withBody('No MUX secrets found', 401, {
      code: CREDENTIALS_ERROR_CODES.invalid,
    })
    expect(toUploadError(invalidByCode)).toEqual(rejected)
  })

  test('maps the codes the API sends with Mux errors', () => {
    const rejectedByMux = withBody('Forbidden - Unauthorized request', 403, {
      statusCode: 403,
      error: 'Forbidden',
      message: 'Unauthorized request',
      code: CREDENTIALS_ERROR_CODES.invalid,
      mux: {type: 'unauthorized', message: 'Unauthorized request'},
    })
    expect(toUploadError(rejectedByMux)).toEqual(rejected)

    const noSecrets = withBody('Unauthorized - No MUX secrets found in this dataset', 401, {
      statusCode: 401,
      error: 'Unauthorized',
      message: 'No MUX secrets found in this dataset',
      code: CREDENTIALS_ERROR_CODES.missing,
    })
    expect(toUploadError(noSecrets)).toEqual(missing)
  })

  test('falls back to the message when the code is unknown', () => {
    const error = withBody('api.mux.com responded with 401', 400, {code: 'something_else'})
    expect(toUploadError(error)).toEqual(rejected)
  })

  test('leaves other errors alone', () => {
    const error = withStatus('api.mux.com responded with 400 (Invalid input)', 400)
    expect(toUploadError(error)).toBe(error)
    const withOtherCode = withBody('Bad request', 400, {code: 'something_else'})
    expect(toUploadError(withOtherCode)).toBe(withOtherCode)
    const rejectedRequest = withBody('Bad Request - Invalid input', 400, {
      message: 'Invalid input',
      code: 'mux_request_rejected',
      mux: {type: 'invalid_parameters', message: 'Invalid input'},
    })
    expect(toUploadError(rejectedRequest)).toBe(rejectedRequest)
  })
})

describe('isUnavailableError', () => {
  test.each([
    ['network error', new Error('Request failed'), true],
    ['500', withStatus('Internal server error', 500), true],
    ['502', withStatus('Bad gateway', 502), true],
    ['400', withStatus('Bad request', 400), false],
    ['401', withStatus('Unauthorized', 401), false],
    ['403', withStatus('Forbidden', 403), false],
    ['404', withStatus('Upload not found', 404), false],
  ])('%s', (_name, error, expected) => {
    expect(isUnavailableError(error)).toBe(expected)
  })
})
