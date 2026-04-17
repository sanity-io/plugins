import type {IntrinsicTypeName, SchemaTypeDefinition} from 'sanity'

import type {PartialSchemaDefinition, PresetResult} from './types'

export type PresetResultFactory = (...args: any[]) => PresetResult

export interface RegistryContext {
  getPreset: (presetName: string, config?: Record<string, unknown>) => Record<string, unknown>
  registryConfig: Record<string, unknown>
}

export interface PresetTypeContext {
  /** Used to derive the define<Name> function on the registry. Must be a simple identifier. */
  name: string
  /** Optional telemetry identifier. If set, recorded when the preset is used. */
  identifier?: string
  schemaType: SchemaTypeDefinition
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
 * Derive the user-facing config type from Context and AliasedType.
 */
type DerivedConfig<
  Context,
  AliasedType extends IntrinsicTypeName | undefined = undefined,
  LockedProperties extends string | undefined = undefined,
> = Context &
  (AliasedType extends string
    ? SanitizeProperties<
        PartialSchemaDefinition<AliasedType>,
        ProhibitedProperties | LockedProperties
      >
    : {}) & {
    /** Field-level properties, used when the preset is placed inline in a fields array. */
    fieldset?: string
    group?: string | string[]
    /**
     * Map hooks allow any schema property created by the preset to be
     * overridden.
     *
     * Each hook receives the value created by the preset, and may return any
     * compatible value.
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
  Context = {},
  AliasedType extends IntrinsicTypeName | undefined = undefined,
  LockedProperties extends string | undefined = undefined,
>(
  factory: (
    config: DerivedConfig<Context, AliasedType, LockedProperties>,
    registry: RegistryContext,
  ) => PresetTypeContext,
): (
  config: DerivedConfig<Context, AliasedType, LockedProperties>,
  registry: RegistryContext,
) => PresetResult {
  return function define(config, registry) {
    const {schemaType, ...attributes} = factory(config, registry)

    for (const [configName, configValue] of Object.entries(config.map ?? {})) {
      if (typeof configValue !== 'function') {
        continue
      }

      // oxlint-disable-next-line no-unsafe-type-assertion
      schemaType[configName as keyof typeof schemaType] = configValue(
        // oxlint-disable-next-line no-unsafe-type-assertion
        schemaType[configName as keyof typeof schemaType],
      )
    }

    return {
      ...attributes,
      type: schemaType,
    }
  }
}
