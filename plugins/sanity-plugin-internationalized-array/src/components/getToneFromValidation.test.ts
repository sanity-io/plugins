import type {FormNodeValidation} from 'sanity'
import {describe, expect, test} from 'vitest'

import {getToneFromValidation} from './getToneFromValidation'

describe('getToneFromValidation', () => {
  test('returns undefined for empty validations', () => {
    expect(getToneFromValidation([])).toBeUndefined()
  })

  test('returns "critical" when error level present', () => {
    const validations: FormNodeValidation[] = [{level: 'error', message: 'Required', path: []}]
    expect(getToneFromValidation(validations)).toBe('critical')
  })

  test('returns "caution" when warning level present without errors', () => {
    const validations: FormNodeValidation[] = [
      {level: 'warning', message: 'Consider filling', path: []},
    ]
    expect(getToneFromValidation(validations)).toBe('caution')
  })

  test('error takes precedence over warning', () => {
    const validations: FormNodeValidation[] = [
      {level: 'warning', message: 'Consider filling', path: []},
      {level: 'error', message: 'Required', path: []},
    ]
    expect(getToneFromValidation(validations)).toBe('critical')
  })

  test('returns undefined for info-level only validations', () => {
    const validations: FormNodeValidation[] = [{level: 'info', message: 'Hint', path: []}]
    expect(getToneFromValidation(validations)).toBeUndefined()
  })
})
