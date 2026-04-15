import type {TelemetryLogger} from '@sanity/telemetry'

import {PresetsAdded} from './__telemetry__/presets.telemetry'

interface RegistryRecord {
  id: string
  /**
   * Identifiers for all preset instances created by this registry's define<Type> functions.
   * The identifier is separate from the user-assigned schema type name — e.g. a user may
   * name a page schema type "marketingPage", but for measurement purposes, the identifier
   * "core.presets.page" is stored here.
   */
  presets: Set<string>
  /** True once telemetry has been submitted for this registry. */
  logged: boolean
}

const registries = new Map<string, RegistryRecord>()

export function registerRegistry(id: string): void {
  registries.set(id, {id, presets: new Set(), logged: false})
}

export function recordPresetUsage(registryId: string, identifier: string): void {
  registries.get(registryId)?.presets.add(identifier)
}

export function collectPresetsRegistryTelemetry(
  registryId: string,
  telemetry: TelemetryLogger,
): void {
  const record = registries.get(registryId)
  if (!record || record.logged) return
  record.logged = true
  if (record.presets.size > 0) {
    telemetry.log(PresetsAdded, {presetNames: [...record.presets]})
  }
}

/**
 * Reset a registry's telemetry state. Exposed for testing only.
 * @internal
 */
export function _resetRegistryForTesting(registryId: string): void {
  const record = registries.get(registryId)
  if (record) {
    record.presets.clear()
    record.logged = false
  }
}

/**
 * Clear all registries. Exposed for testing only.
 * @internal
 */
export function _clearAllRegistriesForTesting(): void {
  registries.clear()
}
