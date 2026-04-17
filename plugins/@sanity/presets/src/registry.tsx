import capitalize from 'lodash-es/capitalize.js'
import type {InputProps, SchemaTypeDefinition} from 'sanity'

import {PresetsTelemetryCollector} from './components/PresetsTelemetryCollector'
import type {PresetResultFactory, RegistryContext} from './definePresetType'
import {ctaType} from './presets/cta-type'
import {imageType} from './presets/image-type'
import {linkType} from './presets/link-type'
import {pageType} from './presets/page-type'
import {seoType} from './presets/seo-type'
import {recordPresetUsage, registerRegistry} from './telemetry'
import type {LinkConfig} from './types'

const systemPresets = [linkType, ctaType, seoType, imageType, pageType] as const

type SystemPresets = typeof systemPresets

export interface PresetsRegistryConfig {
  link?: LinkConfig
}

type PresetConfig<Preset> = Preset extends (config: infer C, registry: RegistryContext) => unknown
  ? C
  : never

type PresetName<Preset> = Preset extends (...args: never[]) => {name: infer N extends string}
  ? N
  : never

type RegistryKey<Preset> = `define${Capitalize<Lowercase<PresetName<Preset>>>}`

export type PresetsRegistry<Extensions extends readonly PresetResultFactory[] = readonly []> = {
  [Preset in [...SystemPresets, ...Extensions][number] as RegistryKey<Preset>]: (
    config: PresetConfig<Preset>,
  ) => SchemaTypeDefinition
}

export function createPresetsRegistry<
  const Extensions extends readonly PresetResultFactory[] = readonly [],
>(
  config: PresetsRegistryConfig & {extensions?: Extensions} = {} as PresetsRegistryConfig & {
    extensions?: Extensions
  },
): PresetsRegistry<Extensions> {
  const registryId = crypto.randomUUID()
  registerRegistry(registryId)

  const allPresets = [...systemPresets, ...(config.extensions ?? [])]
  const registry: Record<string, (config?: Record<string, unknown>) => SchemaTypeDefinition> = {}

  for (const preset of allPresets) {
    const presetName = getPresetName(preset)
    validatePresetName(presetName)
    const key = `define${capitalize(presetName.toLowerCase())}`
    registry[key] = createDefiner(registryId, preset, config, registry)
  }

  // oxlint-disable-next-line no-unsafe-type-assertion -- dynamically built object with computed keys
  return registry as unknown as PresetsRegistry<Extensions>
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

function validatePresetName(name: string): void {
  if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
    throw new Error(
      `Invalid preset name "${name}". The name must be a valid JavaScript identifier ` +
        `(no periods, spaces, or special characters).`,
    )
  }
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
  config: PresetsRegistryConfig & {extensions?: readonly PresetResultFactory[]},
  registry: Record<string, (config?: Record<string, unknown>) => SchemaTypeDefinition>,
): (config?: Record<string, unknown>) => SchemaTypeDefinition {
  const identifier = getPresetIdentifier(preset)

  return function define(userConfig: Record<string, unknown> = {}): SchemaTypeDefinition {
    if (identifier) {
      recordPresetUsage(registryId, identifier)
    }

    const registryContext: RegistryContext = {
      // oxlint-disable-next-line no-unsafe-type-assertion
      registryConfig: config as unknown as Record<string, unknown>,
      getPreset: (presetName: string, presetConfig?: Record<string, unknown>) => {
        const key = `define${capitalize(presetName.toLowerCase())}`
        const definer = registry[key]
        if (!definer) {
          throw new Error(`Cannot resolve preset "${presetName}". No such preset in this registry.`)
        }
        // oxlint-disable-next-line no-unsafe-type-assertion
        return definer(presetConfig) as unknown as Record<string, unknown>
      },
    }

    const result = preset(userConfig, registryContext)

    addTelemetryComponent(result.type, registryId)
    return result.type
  }
}
