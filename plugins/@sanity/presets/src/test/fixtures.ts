import type {FieldDefinition, SchemaTypeDefinition} from 'sanity'
import {defineField} from 'sanity'
import {test as baseTest} from 'vitest'

import type {RegistryContext} from '../definePresetType'
import type {PresetsRegistry, PresetsRegistryConfig} from '../registry'
import {createPresetsRegistry} from '../registry'
import {resetRegistries} from '../telemetry'

export const test = baseTest
  // oxlint-disable-next-line no-empty-pattern
  .extend('_resetRegistries', {auto: true}, ({}, {onCleanup}): void => {
    onCleanup(() => resetRegistries())
  })
  .extend('stubRegistry', (): RegistryContext => {
    return {
      getPreset: () => defineField({name: 'stub', type: 'object', fields: []}),
      lookupArrayPreset: () => undefined,
    }
  })
  .extend('registryConfig', (): PresetsRegistryConfig => ({}))
  .extend('registry', ({registryConfig}): PresetsRegistry => {
    return createPresetsRegistry(registryConfig)
  })

export function getFields(schemaType: SchemaTypeDefinition): FieldDefinition[] {
  if (!('fields' in schemaType) || !schemaType.fields) {
    throw new Error('Expected an object type definition with fields')
  }
  return schemaType.fields
}

export function getField(fields: FieldDefinition[], name: string): FieldDefinition {
  const field = fields.find((entry) => entry.name === name)
  if (!field) {
    throw new Error(`Field "${name}" not found`)
  }
  return field
}
