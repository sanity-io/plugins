import type {FieldDefinition} from 'sanity'
import {defineField} from 'sanity'
import {test as baseTest} from 'vitest'

import type {RegistryContext} from '../definePresetType'
import type {PresetsRegistry, PresetsRegistryConfig} from '../registry'
import {createPresetsRegistry} from '../registry'
import {resetRegistries} from '../telemetry'
import type {PresetResult} from '../types'

export const test = baseTest
  .extend('_resetRegistries', {auto: true}, ({}, {onCleanup}): void => {
    onCleanup(() => resetRegistries())
  })
  .extend('stubRegistry', (): RegistryContext => {
    return {
      getPreset: () => defineField({name: 'stub', type: 'object', fields: []}),
    }
  })
  .extend('registryConfig', (): PresetsRegistryConfig => ({}))
  .extend('registry', ({registryConfig}): PresetsRegistry => {
    return createPresetsRegistry(registryConfig)
  })

export function getFields(result: PresetResult): FieldDefinition[] {
  const typeDef = result.type
  if (!typeDef || !('fields' in typeDef) || !typeDef.fields) {
    throw new Error('Expected an object type definition with fields')
  }
  return typeDef.fields
}

export function getField(fields: FieldDefinition[], name: string): FieldDefinition {
  const field = fields.find((entry) => entry.name === name)
  if (!field) {
    throw new Error(`Field "${name}" not found`)
  }
  return field
}
