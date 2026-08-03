import {uuid} from '@sanity/uuid'
import {type ComponentType} from 'react'
import type {ArrayDefinition, FieldDefinition, InputProps, SchemaTypeDefinition} from 'sanity'

import {PresetsTelemetryCollector} from './components/PresetsTelemetryCollector'
import type {
  AnyPresetDefinition,
  PresetDefinition,
  RegistryContext,
  UserConfig,
} from './definePresetType'
import {ctaType} from './presets/cta-type'
import {imageType, type ImageTypeConfig} from './presets/image-type'
import {linkType, type LinkTypeConfig} from './presets/link-type'
import {createPageType, pageType, type PageTypeConfig} from './presets/page-type'
import {richTextType} from './presets/rich-text-type'
import {seoType} from './presets/seo-type'
import {recordPresetUsage, registerRegistry} from './telemetry'

export interface PresetsRegistryConfig {
  link?: LinkTypeConfig
  image?: ImageTypeConfig
  page?: PageTypeConfig
}

type DefineFunction<Preset extends AnyPresetDefinition> =
  Preset extends PresetDefinition<infer Context, infer AliasedType, infer LockedProperties>
    ? (
        config: UserConfig<Context, AliasedType, LockedProperties>,
      ) => SchemaTypeDefinition & FieldDefinition
    : never

export interface PresetsRegistry {
  defineLink: DefineFunction<typeof linkType>
  defineCta: DefineFunction<typeof ctaType>
  defineSeo: DefineFunction<typeof seoType>
  defineImage: DefineFunction<typeof imageType>
  definePage: DefineFunction<typeof pageType>
  defineRichText: DefineFunction<typeof richTextType>
}

export function createPresetsRegistry(config: PresetsRegistryConfig = {}): PresetsRegistry {
  const registryId = uuid()
  registerRegistry(registryId)

  // oxlint-disable-next-line no-unsafe-type-assertion -- seeding reduce with an empty object that is populated by each iteration
  const seed = {} as DefinerRecord & PresetsRegistry

  // Tracks the schema produced under each defined preset name so `pageType`
  // can resolve string references in `pageBuilderBlocks` regardless of
  // definition order, and wrap array-typed presets at the page builder
  // boundary. Closure-injected into `pageType` via `createPageType` so it
  // does not need to live on the public `RegistryContext`.
  const registeredSchemas = new Map<string, SchemaTypeDefinition>()
  const pageTypeWithLookup = createPageType({
    lookupArrayPreset: (name) => {
      const registered = registeredSchemas.get(name)
      // oxlint-disable-next-line no-unsafe-type-assertion -- discriminating on `type` does not narrow the intersected union
      return registered?.type === 'array' ? (registered as ArrayDefinition) : undefined
    },
  })

  const systemPresets = [
    linkType,
    ctaType,
    seoType,
    imageType,
    pageTypeWithLookup,
    richTextType,
  ] as const

  return systemPresets.reduce((registry, preset) => {
    const key = getPresetKey(preset.name)
    registry[key] = createDefiner({registryId, preset, config, registry, registeredSchemas})
    return registry
  }, seed)
}

export function getPresetKey(name: string): string {
  return `define${name.charAt(0).toUpperCase()}${name.slice(1)}`
}

type Definer = (config?: Record<string, unknown>) => SchemaTypeDefinition & FieldDefinition
type DefinerRecord = Record<string, Definer>

function createRegistryContext({registry}: {registry: DefinerRecord}): RegistryContext {
  return {
    getPreset: (name, presetConfig) => {
      const key = getPresetKey(name)
      const definer = registry[key]
      if (!definer) {
        throw new Error(`Cannot resolve preset "${name}". No such preset in this registry.`)
      }
      return definer(presetConfig)
    },
  }
}

interface CreateDefinerOptions {
  registryId: string
  preset: AnyPresetDefinition
  config: PresetsRegistryConfig
  registry: DefinerRecord
  registeredSchemas: Map<string, SchemaTypeDefinition>
}

function createDefiner({
  registryId,
  preset,
  config,
  registry,
  registeredSchemas,
}: CreateDefinerOptions): Definer {
  return function define(userConfig = {}) {
    const name = userConfig['name']
    if (typeof name !== 'string' || name.length === 0) {
      throw new Error(
        `${getPresetKey(preset.name)}: "name" is required. Pass {name: "yourTypeName"}.`,
      )
    }

    recordPresetUsage(registryId, preset.identifier ?? 'unnamed')

    const registryContext = createRegistryContext({registry})

    // oxlint-disable-next-line no-unsafe-type-assertion -- PresetsRegistryConfig is keyed by preset name; dynamic lookup is safe
    const registryDefaults = (config as Record<string, unknown>)[preset.name]
    const mergedConfig: Record<string, unknown> = {
      ...(typeof registryDefaults === 'object' && registryDefaults !== null
        ? registryDefaults
        : {}),
      ...userConfig,
    }

    const {map, ...factoryConfig} = mergedConfig

    const schemaType = preset.schemaType(
      // oxlint-disable-next-line no-unsafe-type-assertion -- factoryConfig is the merged user config (minus `map`, with `name` injected); its shape matches the factory's expected parameter at runtime
      factoryConfig as unknown as Parameters<AnyPresetDefinition['schemaType']>[0],
      registryContext,
    )

    registeredSchemas.set(name, schemaType)

    // oxlint-disable-next-line no-unsafe-type-assertion -- runtime value is a valid field definition
    return applyMapHooks(
      addTelemetryComponent(schemaType, registryId),
      map,
    ) as SchemaTypeDefinition & FieldDefinition
  }
}

function applyMapHooks(schemaType: SchemaTypeDefinition, map: unknown): SchemaTypeDefinition {
  if (!map || typeof map !== 'object') return schemaType

  const mappedSchemaType: Record<string, unknown> = {}

  for (const [configName, configValue] of Object.entries(map)) {
    if (typeof configValue !== 'function') {
      continue
    }

    mappedSchemaType[configName] = configValue(
      // oxlint-disable-next-line no-unsafe-type-assertion -- map hooks operate on arbitrary schema type properties
      schemaType[configName as keyof typeof schemaType],
    )
  }

  return {...schemaType, ...mappedSchemaType}
}

function addTelemetryComponent(
  schemaType: SchemaTypeDefinition,
  registryId: string,
): SchemaTypeDefinition {
  const existing = 'components' in schemaType ? schemaType.components : undefined
  const existingInput =
    existing && 'input' in existing && typeof existing.input === 'function'
      ? // oxlint-disable-next-line no-unsafe-type-assertion -- presets only produce object/document schema types, whose input components are assignable to ComponentType<InputProps>
        (existing.input as ComponentType<InputProps>)
      : undefined
  // oxlint-disable-next-line no-unsafe-type-assertion -- spreading a discriminated union loses the discriminant; the runtime shape is still a valid SchemaTypeDefinition
  return {
    ...schemaType,
    components: {
      ...existing,
      input: (props: InputProps) => (
        <PresetsTelemetryCollector {...props} registryId={registryId} userInput={existingInput} />
      ),
    },
  } as SchemaTypeDefinition
}
