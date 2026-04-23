import {uuid} from '@sanity/uuid'
import type {ComponentType} from 'react'
import {defineField} from 'sanity'
import type {FieldDefinition, InputProps, SchemaTypeDefinition} from 'sanity'

import {PresetsTelemetryCollector} from './components/PresetsTelemetryCollector'
import type {PresetResultFactory, RegistryContext} from './definePresetType'
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

type DefineFunction<Preset extends PresetResultFactory> = (
  config: Parameters<Preset>[0],
) => SchemaTypeDefinition & FieldDefinition

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

  const registry: Record<
    string,
    (config?: Record<string, unknown>) => SchemaTypeDefinition & FieldDefinition
  > = {}

  for (const preset of systemPresets) {
    const presetName = getPresetName(preset)
    const key = getPresetKey(presetName)
    registry[key] = createDefiner(registryId, preset, config, registry)
  }

  // oxlint-disable-next-line no-unsafe-type-assertion -- dynamically built object with computed keys
  return registry as unknown as PresetsRegistry
}

const stubRegistryContext: RegistryContext = {
  getPreset: () => defineField({name: 'stub', type: 'object', fields: []}),
}

function getPresetName(preset: PresetResultFactory): string {
  const result = preset({}, stubRegistryContext)
  const name = result?.type?.name
  if (!name) {
    throw new Error('Preset must return a schema type with a name property.')
  }
  return name
}

export function getPresetKey(name: string): string {
  return `define${name.charAt(0).toUpperCase()}${name.slice(1)}`
}

function getPresetIdentifier(preset: PresetResultFactory): string | undefined {
  return preset({}, stubRegistryContext)?.identifier
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

function createRegistryContext({
  registry,
}: {
  registry: Record<
    string,
    (config?: Record<string, unknown>) => SchemaTypeDefinition & FieldDefinition
  >
}): RegistryContext {
  return {
    getPreset: (name: string, presetConfig?: Record<string, unknown>) => {
      const key = getPresetKey(name)
      const definer = registry[key]
      if (!definer) {
        throw new Error(`Cannot resolve preset "${name}". No such preset in this registry.`)
      }
      return definer(presetConfig)
    },
  }
}

function createDefiner(
  registryId: string,
  preset: PresetResultFactory,
  config: PresetsRegistryConfig,
  registry: Record<
    string,
    (config?: Record<string, unknown>) => SchemaTypeDefinition & FieldDefinition
  >,
): (config?: Record<string, unknown>) => SchemaTypeDefinition & FieldDefinition {
  const presetName = getPresetName(preset)
  const identifier = getPresetIdentifier(preset)

  return function define(
    userConfig: Record<string, unknown> = {},
  ): SchemaTypeDefinition & FieldDefinition {
    recordPresetUsage(registryId, identifier ?? 'unnamed')

    const registryContext = createRegistryContext({registry})

    // oxlint-disable-next-line no-unsafe-type-assertion
    const registryDefaults = (config as unknown as Record<string, unknown>)[presetName]
    const mergedConfig =
      typeof registryDefaults === 'object' && registryDefaults !== null
        ? {...registryDefaults, ...userConfig}
        : userConfig

    const result = preset(mergedConfig, registryContext)

    addTelemetryComponent(result.type, registryId)

    // oxlint-disable-next-line no-unsafe-type-assertion -- runtime value is a valid field definition
    return result.type as SchemaTypeDefinition & FieldDefinition
  }
}
