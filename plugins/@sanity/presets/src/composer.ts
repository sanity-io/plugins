import {definePlugin, type SchemaTypeDefinition} from 'sanity'

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

export const presetsComposer = definePlugin<PresetResult[]>((presetFields) => ({
  name: '@sanity/presets',
  schema: {types: collectTypes(presetFields)},
}))
