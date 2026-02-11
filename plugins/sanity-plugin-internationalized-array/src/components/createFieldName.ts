import {camelCase, upperFirst} from 'lodash-es'

/**
 * Converts a string to PascalCase (e.g. `"my-field"` -> `"MyField"`).
 */
export function pascalCase(string: string): string {
  return upperFirst(camelCase(string))
}

/**
 * Generates the schema type name for an internationalized array field.
 *
 * - Without the value suffix: `"internationalizedArray{PascalName}"`
 *   (used for the outer array type)
 * - With the value suffix: `"internationalizedArray{PascalName}Value"`
 *   (used for the inner object type that wraps each language entry)
 *
 * For example, `createFieldName('block-content', true)` returns
 * `"internationalizedArrayBlockContentValue"`.
 */
export function createFieldName(name: string, addValue = false): string {
  return addValue
    ? [`internationalizedArray`, pascalCase(name), `Value`].join(``)
    : [`internationalizedArray`, pascalCase(name)].join(``)
}
