import type {CardTone} from '@sanity/ui'
import type {FormNodeValidation} from 'sanity'

/**
 * Maps an array of Sanity form validation entries to a `@sanity/ui` `CardTone`
 * for visual feedback on internationalized array items.
 *
 * - Returns `'critical'` if any validation has `level: 'error'`
 * - Returns `'caution'` if any validation has `level: 'warning'` (and no errors)
 * - Returns `undefined` otherwise (no tone applied)
 *
 * Error level always takes precedence over warning.
 */
export function getToneFromValidation(validations: FormNodeValidation[]): CardTone | undefined {
  if (!validations?.length) {
    return undefined
  }

  const validationLevels = new Set(validations.map((v) => v.level))

  if (validationLevels.has('error')) {
    return `critical`
  } else if (validationLevels.has('warning')) {
    return `caution`
  }

  return undefined
}
