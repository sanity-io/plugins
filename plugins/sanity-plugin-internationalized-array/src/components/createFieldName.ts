import {camelCase, upperFirst} from 'lodash-es'

export function pascalCase(string: string): string {
  return upperFirst(camelCase(string))
}

export function createFieldName(name: string, addValue = false): string {
  return addValue
    ? [`internationalizedArray`, pascalCase(name), `Value`].join(``)
    : [`internationalizedArray`, pascalCase(name)].join(``)
}
