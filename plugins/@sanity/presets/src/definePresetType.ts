import type {
  FieldDefinition,
  FieldDefinitionBase,
  IntrinsicTypeName,
  SchemaTypeDefinition,
} from 'sanity'

import type {PartialSchemaDefinition} from './types'

export interface RegistryContext {
  getPreset: (
    presetName: string,
    config?: Record<string, unknown>,
  ) => SchemaTypeDefinition & FieldDefinition
}

type ProhibitedProperties = 'type'

type SanitizeProperties<Properties, ExcludedProperties extends string | undefined> = [
  ExcludedProperties,
] extends [PropertyKey]
  ? Omit<Properties, ExcludedProperties>
  : Properties

export type DerivedConfig<
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

/**
 * The public-facing config shape that a registry's `define<Name>` function
 * accepts at the call site. Includes the full `DerivedConfig` with required
 * `name` (inherited from `FieldDefinitionBase`) and optional `map`.
 */
export type UserConfig<
  Context = {},
  AliasedType extends IntrinsicTypeName | undefined = undefined,
  LockedProperties extends string | undefined = undefined,
> = DerivedConfig<Context, AliasedType, LockedProperties>

/**
 * A preset definition describes how to produce a Sanity schema type.
 *
 * - `name` is the registry key for the preset (it determines the
 *   `define<Name>` function and the `PresetsRegistryConfig` key).
 * - `identifier` is an optional stable identifier used for telemetry.
 * - `schemaType` is the factory that produces the Sanity schema type. It
 *   receives the merged config (minus `map`) and the registry context, and
 *   returns a `SchemaTypeDefinition`.
 */
export interface PresetDefinition<
  Context = {},
  AliasedType extends IntrinsicTypeName | undefined = undefined,
  LockedProperties extends string | undefined = undefined,
> {
  name: string
  identifier?: string
  schemaType: (
    config: Omit<DerivedConfig<Context, AliasedType, LockedProperties>, 'map' | 'name'> & {
      name: string
    },
    registry: RegistryContext,
  ) => SchemaTypeDefinition
}

/**
 * A typed passthrough for defining a preset. Given a `PresetDefinition`, it
 * returns the same value, narrowed to its concrete generic parameters so
 * downstream code can infer the preset's config type from it.
 *
 * This is intentionally lightweight: it performs no work at call time. The
 * registry is responsible for invoking `schemaType` when a preset is
 * instantiated, and for applying `map` hooks to the produced schema type.
 */
export function definePresetType<
  Context = {},
  AliasedType extends IntrinsicTypeName | undefined = undefined,
  LockedProperties extends string | undefined = undefined,
>(
  preset: PresetDefinition<Context, AliasedType, LockedProperties>,
): PresetDefinition<Context, AliasedType, LockedProperties> {
  return preset
}

/**
 * A preset definition with its generic parameters erased, for use in code
 * that handles presets generically (e.g. the registry).
 */
export type AnyPresetDefinition = PresetDefinition<any, any, any>
