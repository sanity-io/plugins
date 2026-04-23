import {uuid} from '@sanity/uuid'
import type {ComponentType} from 'react'
import type {FieldDefinition, InputProps, SchemaTypeDefinition} from 'sanity'

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
import {pageType, type PageTypeConfig} from './presets/page-type'
import {seoType} from './presets/seo-type'
import {recordPresetUsage, registerRegistry} from './telemetry'

const systemPresets = [linkType, ctaType, seoType, imageType, pageType] as const

export interface PresetsRegistryConfig {
  link?: LinkTypeConfig
  image?: ImageTypeConfig
  page?: PageTypeConfig
}

type DefineFunction<Preset extends AnyPresetDefinition> =
  Preset extends PresetDefinition<infer Context, infer AliasedType, infer LockedProperties>
    ? (
        config?: UserConfig<Context, AliasedType, LockedProperties>,
      ) => SchemaTypeDefinition & FieldDefinition
    : never

export interface PresetsRegistry {
  defineLink: DefineFunction<typeof linkType>
  defineCta: DefineFunction<typeof ctaType>
  defineSeo: DefineFunction<typeof seoType>
  defineImage: DefineFunction<typeof imageType>
  definePage: DefineFunction<typeof pageType>
}

export function createPresetsRegistry(config: PresetsRegistryConfig = {}): PresetsRegistry {
  const registryId = uuid()
  registerRegistry(registryId)

  // oxlint-disable-next-line no-unsafe-type-assertion -- seeding reduce with an empty object that is populated by each iteration
  const seed = {} as DefinerRecord & PresetsRegistry

  return systemPresets.reduce((registry, preset) => {
    const key = getPresetKey(preset.name)
    registry[key] = createDefiner({registryId, preset, config, registry})
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
}

function createDefiner({registryId, preset, config, registry}: CreateDefinerOptions): Definer {
  return function define(userConfig = {}) {
    recordPresetUsage(registryId, preset.identifier ?? 'unnamed')

    const registryContext = createRegistryContext({registry})

    // oxlint-disable-next-line no-unsafe-type-assertion -- PresetsRegistryConfig is keyed by preset name; dynamic lookup is safe
    const registryDefaults = (config as Record<string, unknown>)[preset.name]
    const mergedConfig: Record<string, unknown> = {
      name: preset.name,
      ...(typeof registryDefaults === 'object' && registryDefaults !== null ? registryDefaults : {}),
      ...userConfig,
    }

    const {map, ...factoryConfig} = mergedConfig

    // oxlint-disable-next-line no-unsafe-type-assertion -- factoryConfig is the merged user config minus `map`, matching what the preset's schemaType factory expects
    const schemaType = preset.schemaType(factoryConfig as Parameters<AnyPresetDefinition['schemaType']>[0], registryContext)

    applyMapHooks(schemaType, map)
    addTelemetryComponent(schemaType, registryId)

    // oxlint-disable-next-line no-unsafe-type-assertion -- runtime value is a valid field definition
    return schemaType as SchemaTypeDefinition & FieldDefinition
  }
}

function applyMapHooks(schemaType: SchemaTypeDefinition, map: unknown): void {
  if (!map || typeof map !== 'object') return

  for (const [configName, configValue] of Object.entries(map)) {
    if (typeof configValue !== 'function') {
      continue
    }

    // oxlint-disable-next-line no-unsafe-type-assertion -- map hooks operate on arbitrary schema type properties
    schemaType[configName as keyof typeof schemaType] = configValue(
      // oxlint-disable-next-line no-unsafe-type-assertion
      schemaType[configName as keyof typeof schemaType],
    )
  }
}

function addTelemetryComponent(schemaType: SchemaTypeDefinition, registryId: string): void {
  const existing = 'components' in schemaType ? schemaType.components : undefined
  const existingInput =
    existing && 'input' in existing && typeof existing.input === 'function'
      ? // oxlint-disable-next-line no-unsafe-type-assertion -- presets only produce object/document schema types, whose input components are assignable to ComponentType<InputProps>
        (existing.input as ComponentType<InputProps>)
      : undefined
  Object.assign(schemaType, {
    components: Object.assign({}, existing, {
      input: (props: InputProps) => (
        <PresetsTelemetryCollector {...props} registryId={registryId} userInput={existingInput} />
      ),
    }),
  })
}

// Re-export for consumers that previously used these types.
export type {PresetDefinition, AnyPresetDefinition}
