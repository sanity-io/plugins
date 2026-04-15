import {PresetsAdded} from './__telemetry__/presets.telemetry'

/**
 * Minimal interface for the subset of TelemetryLogger we need.
 * Avoids forcing callers to satisfy the full generic TelemetryLogger type.
 */
export interface TelemetryLog {
  log(event: unknown, data: unknown): void
}

interface RegistryRecord {
  id: string
  presets: Set<string>
  logged: boolean
}

const registries = new Map<string, RegistryRecord>()

export function registerRegistry(id: string): void {
  registries.set(id, {id, presets: new Set(), logged: false})
}

export function recordPresetUsage(registryId: string, identifier: string): void {
  registries.get(registryId)?.presets.add(identifier)
}

export function collectPresetsRegistryTelemetry(registryId: string, telemetry: TelemetryLog): void {
  const record = registries.get(registryId)
  if (!record || record.logged) return
  record.logged = true
  if (record.presets.size > 0) {
    telemetry.log(PresetsAdded, {presetNames: [...record.presets]})
  }
}

/** @internal */
export function _clearAllRegistriesForTesting(): void {
  registries.clear()
}
