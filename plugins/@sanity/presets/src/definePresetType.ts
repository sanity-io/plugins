import type {IntrinsicTypeName, SchemaTypeDefinition} from 'sanity'

import type {PartialSchemaDefinition, PresetResult} from './types'

/**
 * @internal
 */
export const presetProvider: unique symbol = Symbol('presetProvider')

const visitedFactories: unique symbol = Symbol('visitedFactories')
export const registryConfig: unique symbol = Symbol('registryConfig')

export type PresetProvider = 'user' | 'system'

export type PresetResultFactory = (...args: any[]) => PresetResult[]

export interface BaseContext {
  [presetProvider]?: PresetProvider
  [visitedFactories]?: WeakSet<WeakKey>
  [registryConfig]?: unknown
}

export interface PresetTypeContext {
  [presetProvider]?: PresetProvider
  /** Used to derive the define<Name> function on the registry. Must be a simple identifier. */
  name: string
  /** Optional telemetry identifier. If set, recorded when the preset is used. */
  identifier?: string
  schemaType: SchemaTypeDefinition
  composes?: PresetResultFactory[]
}

/**
 * Properties that are never be permitted to be overridden when using any preset.
 */
type ProhibitedProperties = 'type'

/**
 * Prevent excluded properties being assigned to the object.
 */
type SanitizeProperties<Properties, ExcludedProperties extends string | undefined> = [
  ExcludedProperties,
] extends [PropertyKey]
  ? Omit<Properties, ExcludedProperties>
  : Properties

/**
 * Derive context that may be assigned when preset is used.
 */
type DerivedContext<
  Context,
  AliasedType extends IntrinsicTypeName | undefined = undefined,
  LockedProperties extends string | undefined = undefined,
> = BaseContext &
  Context &
  (AliasedType extends string
    ? SanitizeProperties<
        PartialSchemaDefinition<AliasedType>,
        ProhibitedProperties | LockedProperties
      >
    : {}) & {
    /**
     * Map hooks allow any schema property created by the preset to be
     * overridden.
     *
     * Each hook receives the value created by the preset, and may return any
     * compatible value.
     *
     * Map hooks are able to override any schema option. They always receive
     * the value produced by the preset, including any other customisations
     * made in the configuration. For example, if a preset supports appending
     * fields by specifying the `fields` array, `map.fields` will receive all
     * of the fields created by the preset in addition to those defined in the
     * `fields` array.
     */
    map?: AliasedType extends string
      ? {
          [Key in keyof PartialSchemaDefinition<AliasedType>]?: (
            input: PartialSchemaDefinition<AliasedType>[Key],
          ) => PartialSchemaDefinition<AliasedType>[Key]
        }
      : {}
  }

export function definePresetType<
  Context = undefined,
  AliasedType extends IntrinsicTypeName | undefined = undefined,
  /**
   * If a property is locked, users are not permitted to provide a value for
   * that property when creating an instance of the preset. This should be used
   * when a preset does not consider a user-provided property, or does not pass
   * it to the underlying schema definition.
   *
   * Users may still ultimately override any property, including locked
   * properties, by using the map hooks.
   */
  LockedProperties extends string | undefined = undefined,
>(
  factory: (context?: DerivedContext<Context, AliasedType, LockedProperties>) => PresetTypeContext,
): (context?: DerivedContext<Context, AliasedType, LockedProperties>) => PresetResult[] {
  return function define(context) {
    const {schemaType, composes = [], ...attributes} = factory(context)
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

    for (const [configName, configValue] of Object.entries(context?.map ?? {})) {
      if (typeof configValue !== 'function') {
        continue
      }

      // oxlint-disable-next-line no-unsafe-type-assertion
      schemaType[configName as keyof typeof schemaType] = configValue(
        // oxlint-disable-next-line no-unsafe-type-assertion
        schemaType[configName as keyof typeof schemaType],
      )
    }

    return dependencies.concat({
      ...attributes,
      type: schemaType,
      [presetProvider]: context?.[presetProvider] ?? 'user',
    })
  }
}
