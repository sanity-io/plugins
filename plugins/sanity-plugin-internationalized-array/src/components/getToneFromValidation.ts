import type {CardTone} from '@sanity/ui'
import type {FormNodeValidation} from 'sanity'

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
