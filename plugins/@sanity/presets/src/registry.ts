import type {InputProps, SchemaTypeDefinition} from 'sanity'

import {PresetsTelemetryCollector} from './components/PresetsTelemetryCollector'
import type {PresetResultFactory, PresetTypeContext} from './definePresetType'
import {ctaType} from './presets/cta-type'
import {imageType} from './presets/image-type'
import {linkType} from './presets/link-type'
import {pageType} from './presets/page-type'
import {seoType} from './presets/seo-type'
import {recordPresetUsage, registerRegistry} from './telemetry'
import type {LinkConfig} from './types'

/**
 * The system presets included with every registry.
 */
const systemPresets = [linkType, ctaType, seoType, imageType, pageType] as const

export interface PresetsRegistryConfig {
  link?: LinkConfig
  extensions?: PresetResultFactory[]
}

export interface PresetsRegistry {
  [key: string]: (...args: unknown[]) => SchemaTypeDefinition | SchemaTypeDefinition[]
}

/**
 * Create a presets registry. Returns an object with `define<Name>` functions
 * for every system preset and every extension preset.
 *
 * @example
 * ```ts
 * const {defineLink, defineCta, definePage} = createPresetsRegistry({
 *   link: {internalTypes: ['marketingPage']},
 * })
 * ```
 */
export function createPresetsRegistry(config: PresetsRegistryConfig = {}): PresetsRegistry {
  const registryId = crypto.randomUUID()
  registerRegistry(registryId)

  const allPresets = [...systemPresets, ...(config.extensions ?? [])]
  const registry: Record<string, unknown> = {}

  for (const preset of allPresets) {
    const presetName = getPresetName(preset)
    validatePresetName(presetName)
    const key = `define${capitalize(presetName.toLowerCase())}`
    registry[key] = createDefiner(registryId, preset, config)
  }

  return registry as PresetsRegistry
}

/**
 * Extract the preset name from a PresetResultFactory by calling it with
 * no arguments and reading the first result's name.
 */
function getPresetName(preset: PresetResultFactory): string {
  const results = preset()
  const last = results[results.length - 1]
  if (!last?.name) {
    throw new Error('Preset must return at least one result with a name property.')
  }
  return last.name
}

/**
 * Extract the preset identifier from a PresetResultFactory by calling it with
 * no arguments and reading the first result's identifier.
 */
function getPresetIdentifier(preset: PresetResultFactory): string | undefined {
  const results = preset()
  const last = results[results.length - 1]
  return last?.identifier
}

/**
 * Validate that a preset name can be used as part of a JavaScript identifier.
 */
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

/**
 * Wrap a definePresetType-based preset into a user-facing define<Name> function.
 *
 * The wrapper:
 * 1. Records telemetry usage (if the preset has an identifier)
 * 2. Attaches components.input for telemetry collection
 * 3. Passes the registry config and user call-site options to the preset
 */
function createDefiner(
  registryId: string,
  preset: PresetResultFactory,
  config: PresetsRegistryConfig,
) {
  const identifier = getPresetIdentifier(preset)

  return function define(context?: Record<string, unknown>) {
    if (identifier) {
      recordPresetUsage(registryId, identifier)
    }

    // Call the underlying preset with the user's context merged with registry config.
    // The preset reads what it needs from the context.
    // Link config is surfaced at the top level for presets that read internalTypes.
    const results = preset({
      ...context,
      // Make registry config available. Individual presets destructure what they need.
      // Link config is surfaced at the top level for presets that read internalTypes.
      ...(config.link?.internalTypes ? {internalTypes: config.link.internalTypes} : {}),
    })

    // The last result is the preset's own type; earlier results are composed dependencies.
    // Attach the telemetry input component to each schema type.
    for (const result of results) {
      const schemaType = result.type as SchemaTypeDefinition & {
        components?: {input?: unknown}
      }

      const existingInput = schemaType.components?.input

      schemaType.components = {
        ...schemaType.components,
        input: (props: InputProps) =>
          PresetsTelemetryCollector({
            ...props,
            registryId,
            ...(existingInput ? {renderDefault: existingInput as InputProps['renderDefault']} : {}),
          }),
      }
    }

    // Return the schema types. For presets that return a single type, return
    // just that type. For presets with composed dependencies, return all types.
    const types = results.map((r) => r.type)
    if (types.length === 1) {
      return types[0]
    }
    return types
  }
}
