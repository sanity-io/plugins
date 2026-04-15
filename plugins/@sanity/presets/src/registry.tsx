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

type SystemPresets = typeof systemPresets

export interface PresetsRegistryConfig {
  link?: LinkConfig
  extensions?: PresetResultFactory[]
}

/**
 * Extract the user-facing context type from a preset, omitting the
 * registryConfig that is injected internally by createDefiner.
 */
type PresetContext<Preset> = Preset extends (context?: infer C) => unknown
  ? Omit<NonNullable<C>, 'registryConfig'>
  : never

/**
 * Derive the registry key from a preset's name property.
 * E.g. a preset whose name is 'link' produces key 'defineLink'.
 */
type PresetName<Preset> = Preset extends (...args: never[]) => Array<infer R>
  ? R extends {name: infer N extends string}
    ? N
    : never
  : never

type RegistryKey<Preset> = `define${Capitalize<Lowercase<PresetName<Preset>>>}`

/**
 * The registry type: a mapped type over all presets (system + extensions).
 * Each entry's key, parameter type, and return type are derived from the preset.
 */
export type PresetsRegistry<Extensions extends readonly PresetResultFactory[] = readonly []> = {
  [Preset in [...SystemPresets, ...Extensions][number] as RegistryKey<Preset>]: (
    context?: PresetContext<Preset>,
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
  const registry: Record<string, (context?: Record<string, unknown>) => SchemaTypeDefinition> = {}

  for (const preset of allPresets) {
    const presetName = getPresetName(preset)
    validatePresetName(presetName)
    const key = `define${capitalize(presetName.toLowerCase())}`
    registry[key] = createDefiner(registryId, preset, config)
  }

  // oxlint-disable-next-line no-unsafe-type-assertion
  return registry as PresetsRegistry<Extensions>
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
): (context?: Record<string, unknown>) => SchemaTypeDefinition {
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
