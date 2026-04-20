import {uuid} from '@sanity/uuid'
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

type SystemPresets = typeof systemPresets

export interface PresetsRegistryConfig {
  link?: LinkTypeConfig
  cta?: {}
  seo?: {}
  image?: ImageTypeConfig
  page?: PageTypeConfig
}

type PresetConfig<Preset> = Preset extends (
  config: infer Config,
  registry: RegistryContext,
) => unknown
  ? Config
  : never

type PresetName<Preset> = Preset extends (...args: never[]) => {name: infer Name extends string}
  ? Name
  : never

type RegistryKey<Preset> = `define${Capitalize<PresetName<Preset>>}`

export type PresetsRegistry = {
  [Preset in SystemPresets[number] as RegistryKey<Preset>]: (
    config: PresetConfig<Preset>,
  ) => SchemaTypeDefinition & FieldDefinition
}

export function createPresetsRegistry(config: PresetsRegistryConfig = {}): PresetsRegistry {
  const registryId = uuid()
  registerRegistry(registryId)

  const registry: Record<string, (config?: Record<string, unknown>) => SchemaTypeDefinition> = {}

  for (const preset of systemPresets) {
    const presetName = getPresetName(preset)
    const key = `define${presetName.charAt(0).toUpperCase()}${presetName.slice(1)}`
    registry[key] = createDefiner(registryId, preset, config, registry)
  }

  // oxlint-disable-next-line no-unsafe-type-assertion -- dynamically built object with computed keys
  return registry as unknown as PresetsRegistry
}

const stubRegistryContext: RegistryContext = {
  getPreset: () => ({}),
  registryConfig: {},
}

function getPresetName(preset: PresetResultFactory): string {
  const result = preset({}, stubRegistryContext)
  if (!result?.name) {
    throw new Error('Preset must return a result with a name property.')
  }
  return result.name
}

function getPresetIdentifier(preset: PresetResultFactory): string | undefined {
  return preset({}, stubRegistryContext)?.identifier
}

function addTelemetryComponent(schemaType: SchemaTypeDefinition, registryId: string): void {
  const existing = 'components' in schemaType ? schemaType.components : undefined
  Object.assign(schemaType, {
    components: Object.assign({}, existing, {
      input: (props: InputProps) => (
        <PresetsTelemetryCollector {...props} registryId={registryId} />
      ),
    }),
  })
}

function createDefiner(
  registryId: string,
  preset: PresetResultFactory,
  config: PresetsRegistryConfig,
  registry: Record<string, (config?: Record<string, unknown>) => SchemaTypeDefinition>,
): (config?: Record<string, unknown>) => SchemaTypeDefinition & FieldDefinition {
  const presetName = getPresetName(preset)
  const identifier = getPresetIdentifier(preset)

  return function define(
    userConfig: Record<string, unknown> = {},
  ): SchemaTypeDefinition & FieldDefinition {
    recordPresetUsage(registryId, identifier ?? 'unnamed')

    const registryContext: RegistryContext = {
      // oxlint-disable-next-line no-unsafe-type-assertion
      registryConfig: config as unknown as Record<string, unknown>,
      getPreset: (presetName: string, presetConfig?: Record<string, unknown>) => {
        const key = `define${presetName.charAt(0).toUpperCase()}${presetName.slice(1)}`
        const definer = registry[key]
        if (!definer) {
          throw new Error(`Cannot resolve preset "${presetName}". No such preset in this registry.`)
        }
        // oxlint-disable-next-line no-unsafe-type-assertion
        return definer(presetConfig) as unknown as Record<string, unknown>
      },
    }

    const {group, fieldset, ...presetConfig} = userConfig

    // oxlint-disable-next-line no-unsafe-type-assertion
    const registryDefaults = (config as unknown as Record<string, unknown>)[presetName]
    const mergedConfig =
      typeof registryDefaults === 'object' && registryDefaults !== null
        ? {...registryDefaults, ...presetConfig}
        : presetConfig

    const result = preset(mergedConfig, registryContext)

    addTelemetryComponent(result.type, registryId)

    const output = result.type
    if (group !== undefined) Object.assign(output, {group})
    if (fieldset !== undefined) Object.assign(output, {fieldset})
    // oxlint-disable-next-line no-unsafe-type-assertion -- runtime value is a valid field definition
    return output as SchemaTypeDefinition & FieldDefinition
  }
}
