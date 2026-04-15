import type {InputProps, SchemaTypeDefinition} from 'sanity'

import {PresetsTelemetryCollector} from './components/PresetsTelemetryCollector'
import type {PresetResultFactory} from './definePresetType'
import {ctaType} from './presets/cta-type'
import {imageType} from './presets/image-type'
import {linkType} from './presets/link-type'
import {pageType} from './presets/page-type'
import {seoType} from './presets/seo-type'
import {recordPresetUsage, registerRegistry} from './telemetry'
import type {LinkConfig} from './types'

const systemPresets = [linkType, ctaType, seoType, imageType, pageType] as const

export interface PresetsRegistryConfig {
  link?: LinkConfig
  extensions?: PresetResultFactory[]
}

type DefineFunction = (context?: Record<string, unknown>) => SchemaTypeDefinition

export type PresetsRegistry = Record<string, DefineFunction>

export function createPresetsRegistry(config: PresetsRegistryConfig = {}): PresetsRegistry {
  const registryId = crypto.randomUUID()
  registerRegistry(registryId)

  const allPresets = [...systemPresets, ...(config.extensions ?? [])]
  const registry: PresetsRegistry = {}

  for (const preset of allPresets) {
    const presetName = getPresetName(preset)
    validatePresetName(presetName)
    const key = `define${capitalize(presetName.toLowerCase())}`
    registry[key] = createDefiner(registryId, preset, config)
  }

  return registry
}

function getPresetName(preset: PresetResultFactory): string {
  const results = preset()
  const last = results[results.length - 1]
  if (!last?.name) {
    throw new Error('Preset must return at least one result with a name property.')
  }
  return last.name
}

function getPresetIdentifier(preset: PresetResultFactory): string | undefined {
  const results = preset()
  const last = results[results.length - 1]
  return last?.identifier
}

function validatePresetName(name: string): void {
  if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
    throw new Error(
      `Invalid preset name "${name}". The name must be a valid JavaScript identifier ` +
        `(no periods, spaces, or special characters).`,
    )
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
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
): DefineFunction {
  const identifier = getPresetIdentifier(preset)

  return function define(context?: Record<string, unknown>): SchemaTypeDefinition {
    if (identifier) {
      recordPresetUsage(registryId, identifier)
    }

    const results = preset({
      ...context,
      registryConfig: config,
    })

    const last = results[results.length - 1]
    if (!last) {
      throw new Error('Preset returned no results.')
    }
    addTelemetryComponent(last.type, registryId)
    return last.type
  }
}
