import {type PluginOptions, type SchemaTypeDefinition} from 'sanity'

import {presetProvider} from './definePresetType'
import type {PresetResult} from './types'

export function collectTypes(presets: PresetResult[][]): SchemaTypeDefinition[] {
  const userSeen = new Set<string>()
  const systemSeen = new Set<string>()

  return presets
    .flat()
    .toSorted(sortUserPrecedence)
    .filter((preset) => {
      const {type} = preset
      const provider = preset[presetProvider]

      if (userSeen.has(type.name)) {
        if (provider === 'user') {
          console.warn(
            `[@sanity/presets] Dropped duplicate type "${type.name}". Keeping first definition.`,
          )
        }
        return false
      }

      if (systemSeen.has(type.name)) {
        return false
      }

      if (provider === 'user') {
        userSeen.add(type.name)
      }

      if (provider === 'system') {
        systemSeen.add(type.name)
      }

      return true
    })
    .map(({type}) => type)
}

export function presets(...types: PresetResult[][]): PluginOptions {
  return {
    name: '@sanity/presets',
    schema: {types: collectTypes(types)},
  }
}

function sortUserPrecedence(a: PresetResult, b: PresetResult): number {
  if (a[presetProvider] === 'user' && b[presetProvider] === 'system') {
    return -1
  }

  if (a[presetProvider] === 'system' && b[presetProvider] === 'user') {
    return 1
  }

  return 0
}
