import type {SchemaTypeDefinition} from 'sanity'

import type {PresetResult} from './types'

/**
 * @internal
 */
export const presetProvider: unique symbol = Symbol('presetProvider')

const visitedFactories: unique symbol = Symbol('visitedFactories')

export type PresetProvider = 'user' | 'system'

export type PresetResultFactory = (...args: any[]) => PresetResult[]

export interface BaseContext {
  [presetProvider]?: PresetProvider
  [visitedFactories]?: WeakSet<WeakKey>
}

export interface PresetTypeContext {
  [presetProvider]?: PresetProvider
  schemaType: SchemaTypeDefinition
  composes?: PresetResultFactory[]
}

export function definePresetType<Context = void>(
  factory: (context?: Context) => PresetTypeContext,
): (context?: BaseContext & Context) => PresetResult[] {
  return function define(context) {
    const {schemaType, composes = []} = factory(context)
    const visited = context?.[visitedFactories] ?? new WeakSet()

    if (visited.has(factory)) {
      throw new Error(`Found circular dependency resolving preset \`${schemaType.name}\`.`)
    }

    visited.add(factory)

    const dependencies = composes.flatMap<PresetResult>((composedFactory) =>
      composedFactory({
        [presetProvider]: 'system',
        [visitedFactories]: visited,
      }),
    )

    return dependencies.concat({
      type: schemaType,
      [presetProvider]: context?.[presetProvider] ?? 'user',
    })
  }
}
