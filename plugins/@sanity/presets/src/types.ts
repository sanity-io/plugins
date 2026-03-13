import type {SchemaTypeDefinition} from 'sanity'

export interface BasePresetConfig {
  name?: string
}

export interface PresetResult {
  types: SchemaTypeDefinition[]
}
