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

/**
 * System preset configuration keys — declared explicitly to avoid
 * a circular reference between PresetsRegistryConfig, SystemPresets,
 * and the preset factories that read from registryConfig.
 */
interface SystemPresetsConfig {
  link?: LinkTypeConfig
  cta?: {}
  seo?: {}
  image?: ImageTypeConfig
  page?: PageTypeConfig
}

/**
 * Registry configuration derived from system presets and user extensions.
 * System preset keys (link, cta, seo, image, page) are declared explicitly.
 * Extension keys are accepted via an index signature — extensions read
 * their config from registry.registryConfig at runtime.
 */
export type PresetsRegistryConfig = SystemPresetsConfig & Record<string, unknown>

type PresetConfig<Preset> = Preset extends (config: infer C, registry: RegistryContext) => unknown
  ? C
  : never

type PresetName<Preset> = Preset extends (...args: never[]) => {name: infer N extends string}
  ? N
  : never

type RegistryKey<Preset> = `define${Capitalize<PresetName<Preset>>}`

export type PresetsRegistry<Extensions extends readonly PresetResultFactory[] = readonly []> = {
  [Preset in [...SystemPresets, ...Extensions][number] as RegistryKey<Preset>]: (
    config: PresetConfig<Preset>,
  ) => SchemaTypeDefinition & FieldDefinition
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
    const key = `define${presetName.charAt(0).toUpperCase()}${presetName.slice(1)}`
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
  config: Record<string, unknown>,
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

    // Merge the preset's registry config entry as defaults under
    // the user's call-site config. Call-site values take precedence.
    const registryDefaults = config[presetName]
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
