import {definePlugin, type PluginOptions, type SchemaTypeDefinition} from 'sanity'

import type {PresetResult} from './types'

export function collectTypes(presets: PresetResult[]): SchemaTypeDefinition[] {
  const seen = new Set<string>()

  return presets.flatMap((preset) =>
    preset.types.filter((typeDef) => {
      if (seen.has(typeDef.name)) {
        console.warn(
          `[@sanity/presets] Duplicate type "${typeDef.name}" was dropped. The first definition will be used.`,
        )
        return false
      }
      seen.add(typeDef.name)
      return true
    }),
  )
}

export function presetsComposer(presets: PresetResult[]): PluginOptions {
  const types = collectTypes(presets)

  return definePlugin({
    name: '@sanity/presets',
    schema: {types},
  })()
}
