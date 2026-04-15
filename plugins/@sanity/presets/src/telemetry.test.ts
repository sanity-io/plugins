import {afterEach, describe, expect, test, vi} from 'vitest'

import {
  _clearAllRegistriesForTesting,
  collectPresetsRegistryTelemetry,
  recordPresetUsage,
  registerRegistry,
} from './telemetry'

describe('telemetry', () => {
  afterEach(() => {
    _clearAllRegistriesForTesting()
  })

  test('registerRegistry creates a new registry record', () => {
    registerRegistry('test-id')
    // Verify it exists by recording usage (would be a no-op for unknown ids)
    recordPresetUsage('test-id', 'core.presets.link')

    const telemetry = {log: vi.fn()}
    collectPresetsRegistryTelemetry('test-id', telemetry as never)

    expect(telemetry.log).toHaveBeenCalledOnce()
  })

  test('recordPresetUsage adds the identifier to the registry set', () => {
    registerRegistry('test-id')
    recordPresetUsage('test-id', 'core.presets.link')
    recordPresetUsage('test-id', 'core.presets.cta')
    recordPresetUsage('test-id', 'core.presets.link') // duplicate, should be deduplicated

    const telemetry = {log: vi.fn()}
    collectPresetsRegistryTelemetry('test-id', telemetry as never)

    expect(telemetry.log).toHaveBeenCalledWith(expect.anything(), {
      presetNames: expect.arrayContaining(['core.presets.link', 'core.presets.cta']),
    })
    // Should only have 2 unique entries
    const callArgs = telemetry.log.mock.calls[0]?.[1] as {presetNames: string[]}
    expect(callArgs.presetNames).toHaveLength(2)
  })

  test('collectPresetsRegistryTelemetry logs all recorded preset names', () => {
    registerRegistry('test-id')
    recordPresetUsage('test-id', 'core.presets.link')
    recordPresetUsage('test-id', 'core.presets.page')

    const telemetry = {log: vi.fn()}
    collectPresetsRegistryTelemetry('test-id', telemetry as never)

    expect(telemetry.log).toHaveBeenCalledOnce()
    expect(telemetry.log).toHaveBeenCalledWith(expect.anything(), {
      presetNames: expect.arrayContaining(['core.presets.link', 'core.presets.page']),
    })
  })

  test('collectPresetsRegistryTelemetry does not log twice for the same registry', () => {
    registerRegistry('test-id')
    recordPresetUsage('test-id', 'core.presets.link')

    const telemetry = {log: vi.fn()}
    collectPresetsRegistryTelemetry('test-id', telemetry as never)
    collectPresetsRegistryTelemetry('test-id', telemetry as never)
    collectPresetsRegistryTelemetry('test-id', telemetry as never)

    expect(telemetry.log).toHaveBeenCalledOnce()
  })

  test('collectPresetsRegistryTelemetry is a no-op for unknown registry id', () => {
    const telemetry = {log: vi.fn()}
    collectPresetsRegistryTelemetry('unknown-id', telemetry as never)

    expect(telemetry.log).not.toHaveBeenCalled()
  })

  test('collectPresetsRegistryTelemetry does not log when no presets were recorded', () => {
    registerRegistry('test-id')

    const telemetry = {log: vi.fn()}
    collectPresetsRegistryTelemetry('test-id', telemetry as never)

    expect(telemetry.log).not.toHaveBeenCalled()
  })

  test('recordPresetUsage is a no-op for unknown registry id', () => {
    // Should not throw
    recordPresetUsage('unknown-id', 'core.presets.link')

    const telemetry = {log: vi.fn()}
    collectPresetsRegistryTelemetry('unknown-id', telemetry as never)
    expect(telemetry.log).not.toHaveBeenCalled()
  })
})
