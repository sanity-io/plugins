import {type PluginOptions, type SchemaTypeDefinition} from 'sanity'

import type {PresetResult} from './types'

export function collectTypes(presets: PresetResult[]): SchemaTypeDefinition[] {
  const seen = new Set<string>()

  return presets.flatMap((preset) =>
    preset.types.filter((typeDef) => {
      if (seen.has(typeDef.name)) {
        console.warn(
          `[@sanity/presets] Dropped duplicate type "${typeDef.name}". Keeping first definition.`,
        )
        return false
      }
      seen.add(typeDef.name)
      return true
    }),
  )
}

export function presets(...types: PresetResult[]): PluginOptions {
  return {
    name: '@sanity/presets',
    schema: {types: collectTypes(types)},
  }
}
