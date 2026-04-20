import type {FieldDefinitionBase, IntrinsicTypeName, SchemaTypeDefinition} from 'sanity'

import type {PartialSchemaDefinition, PresetResult} from './types'

export type PresetResultFactory = (...args: any[]) => PresetResult

export interface RegistryContext {
  getPreset: (presetName: string, config?: Record<string, unknown>) => Record<string, unknown>
  registryConfig: Record<string, unknown>
}

interface PresetTypeContext {
  name: string
  identifier?: string
  schemaType: SchemaTypeDefinition
}

type ProhibitedProperties = 'type'

type SanitizeProperties<Properties, ExcludedProperties extends string | undefined> = [
  ExcludedProperties,
] extends [PropertyKey]
  ? Omit<Properties, ExcludedProperties>
  : Properties

type DerivedConfig<
  Context,
  AliasedType extends IntrinsicTypeName | undefined = undefined,
  LockedProperties extends string | undefined = undefined,
> = Context &
  FieldDefinitionBase &
  (AliasedType extends string
    ? SanitizeProperties<
        PartialSchemaDefinition<AliasedType>,
        ProhibitedProperties | LockedProperties
      >
    : {}) & {
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
