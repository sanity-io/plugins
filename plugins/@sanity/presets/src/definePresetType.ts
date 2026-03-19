import type {SchemaTypeDefinition} from 'sanity'

import type {PresetResult} from './types'

/**
 * @internal
 */
export const presetProvider: unique symbol = Symbol('presetProvider')

export type PresetProvider = 'user' | 'system'

export type PresetResultFactory = (...args: any[]) => PresetResult[]

export interface PresetTypeContext {
  [presetProvider]?: PresetProvider
  schemaType: SchemaTypeDefinition
  composes?: PresetResultFactory[]
}

export function definePresetType<Context = void>(
  factory: (context?: Context) => PresetTypeContext,
): (context?: Context) => PresetResult[] {
  return function define(context) {
    const {schemaType, composes = []} = factory(context)

    const dependencies = composes.flatMap<PresetResult>((composedFactory) =>
      composedFactory({
        [presetProvider]: 'system',
      }),
    )

    return dependencies.concat({
      type: schemaType,
      [presetProvider]: 'user',
    })
  }
}
