import {afterEach, describe, expect, test, vi} from 'vitest'

import {
  _clearAllRegistriesForTesting,
  collectPresetsRegistryTelemetry,
  recordPresetUsage,
  registerRegistry,
  type TelemetryLog,
} from './telemetry'

function createMockTelemetry() {
  const logSpy = vi.fn()
  const telemetry: TelemetryLog = {log: logSpy}
  return {telemetry, logSpy}
}

describe('telemetry', () => {
  afterEach(() => {
    _clearAllRegistriesForTesting()
  })

  test('registerRegistry creates a new registry record', () => {
    registerRegistry('test-id')
    recordPresetUsage('test-id', 'core.presets.link')

    const {telemetry, logSpy} = createMockTelemetry()
    collectPresetsRegistryTelemetry('test-id', telemetry)

    expect(logSpy).toHaveBeenCalledOnce()
  })

  test('recordPresetUsage adds the identifier to the registry set', () => {
    registerRegistry('test-id')
    recordPresetUsage('test-id', 'core.presets.link')
    recordPresetUsage('test-id', 'core.presets.cta')
    recordPresetUsage('test-id', 'core.presets.link')

    const {telemetry, logSpy} = createMockTelemetry()
    collectPresetsRegistryTelemetry('test-id', telemetry)

    expect(logSpy).toHaveBeenCalledWith(expect.anything(), {
      presetNames: expect.arrayContaining(['core.presets.link', 'core.presets.cta']),
    })
  })

  test('collectPresetsRegistryTelemetry logs all recorded preset names', () => {
    registerRegistry('test-id')
    recordPresetUsage('test-id', 'core.presets.link')
    recordPresetUsage('test-id', 'core.presets.page')

    const {telemetry, logSpy} = createMockTelemetry()
    collectPresetsRegistryTelemetry('test-id', telemetry)

    expect(logSpy).toHaveBeenCalledOnce()
    expect(logSpy).toHaveBeenCalledWith(expect.anything(), {
      presetNames: expect.arrayContaining(['core.presets.link', 'core.presets.page']),
    })
  })

  test('collectPresetsRegistryTelemetry does not log twice for the same registry', () => {
    registerRegistry('test-id')
    recordPresetUsage('test-id', 'core.presets.link')

    const {telemetry, logSpy} = createMockTelemetry()
    collectPresetsRegistryTelemetry('test-id', telemetry)
    collectPresetsRegistryTelemetry('test-id', telemetry)
    collectPresetsRegistryTelemetry('test-id', telemetry)

    expect(logSpy).toHaveBeenCalledOnce()
  })

  test('collectPresetsRegistryTelemetry is a no-op for unknown registry id', () => {
    const {telemetry, logSpy} = createMockTelemetry()
    collectPresetsRegistryTelemetry('unknown-id', telemetry)

    expect(logSpy).not.toHaveBeenCalled()
  })

  test('collectPresetsRegistryTelemetry does not log when no presets were recorded', () => {
    registerRegistry('test-id')

    const {telemetry, logSpy} = createMockTelemetry()
    collectPresetsRegistryTelemetry('test-id', telemetry)

    expect(logSpy).not.toHaveBeenCalled()
  })

  test('recordPresetUsage is a no-op for unknown registry id', () => {
    recordPresetUsage('unknown-id', 'core.presets.link')

    const {telemetry, logSpy} = createMockTelemetry()
    collectPresetsRegistryTelemetry('unknown-id', telemetry)
    expect(logSpy).not.toHaveBeenCalled()
  })
})
