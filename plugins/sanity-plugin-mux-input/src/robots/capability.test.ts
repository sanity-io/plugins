import {describe, expect, test} from 'vitest'

import {RobotsRequestError} from '../actions/robots'
import {advisoryFromError, capabilityFromError} from './capability'

const muxError = (status: number, type?: string, message = 'Mux says no.') =>
  new RobotsRequestError(message, {status, ...(type && {type}), muxAnswered: true})

describe('capabilityFromError', () => {
  test('a 401 from Mux is a token without the robots:* scope', () => {
    expect(capabilityFromError(muxError(401, 'unauthorized'))).toEqual({state: 'scope-missing'})
  })

  test('a forbidden 403 is Robots not being enabled, with the terms page when named', () => {
    expect(capabilityFromError(muxError(403, 'forbidden'))).toEqual({state: 'not-enabled'})
    expect(capabilityFromError(muxError(403))).toEqual({state: 'not-enabled'})
    const withLink = muxError(403, 'forbidden', 'Accept at https://dashboard.mux.com/o/1/robots.')
    expect(capabilityFromError(withLink)).toEqual({
      state: 'not-enabled',
      termsUrl: 'https://dashboard.mux.com/o/1/robots',
    })
  })

  test('a 404 from the proxy itself means it has no Robots routes yet', () => {
    const proxy404 = new RobotsRequestError('Not Found', {status: 404})
    expect(capabilityFromError(proxy404)).toEqual({state: 'unavailable'})
    expect(capabilityFromError(muxError(404, 'not_found'))).toBeUndefined()
  })

  test("the proxy's own 401 says nothing about Robots", () => {
    const noSecrets = new RobotsRequestError('No MUX secrets found', {status: 401})
    expect(capabilityFromError(noSecrets)).toBeUndefined()
  })

  test.each([
    [403, 'robots_units_limit_exceeded'],
    [403, 'robots_workflow_not_available'],
    [400, 'invalid_parameters'],
    [409, 'conflict'],
    [422, 'unprocessable_entity'],
  ])('a refused run (%i %s) is not a capability', (status, type) => {
    expect(capabilityFromError(muxError(status, type))).toBeUndefined()
  })

  test('network errors and other values are not a capability', () => {
    expect(capabilityFromError(new RobotsRequestError('Network error', {}))).toBeUndefined()
    expect(capabilityFromError(new Error('boom'))).toBeUndefined()
  })
})

describe('advisoryFromError', () => {
  test('a units refusal is a warning over a working panel', () => {
    expect(advisoryFromError(muxError(403, 'robots_units_limit_exceeded'))).toBe('units-exhausted')
    expect(advisoryFromError(muxError(403, 'forbidden'))).toBeUndefined()
  })
})
