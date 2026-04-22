import {afterEach, describe, expect, test, vi} from 'vitest'

import {
  resetRegistries,
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
    resetRegistries()
  })

  test('registerRegistry creates a new registry record', () => {
    registerRegistry('test-id')
    recordPresetUsage('test-id', 'core.link')

    const {telemetry, logSpy} = createMockTelemetry()
    collectPresetsRegistryTelemetry('test-id', telemetry)

    expect(logSpy).toHaveBeenCalledOnce()
  })

  test('recordPresetUsage adds the identifier to the registry set', () => {
    registerRegistry('test-id')
    recordPresetUsage('test-id', 'core.link')
    recordPresetUsage('test-id', 'core.cta')
    recordPresetUsage('test-id', 'core.link')

    const {telemetry, logSpy} = createMockTelemetry()
    collectPresetsRegistryTelemetry('test-id', telemetry)

    expect(logSpy).toHaveBeenCalledWith(expect.anything(), {
      presetNames: expect.arrayContaining(['core.link', 'core.cta']),
    })
  })

  test('collectPresetsRegistryTelemetry logs all recorded preset names', () => {
    registerRegistry('test-id')
    recordPresetUsage('test-id', 'core.link')
    recordPresetUsage('test-id', 'core.page')

    const {telemetry, logSpy} = createMockTelemetry()
    collectPresetsRegistryTelemetry('test-id', telemetry)

    expect(logSpy).toHaveBeenCalledOnce()
    expect(logSpy).toHaveBeenCalledWith(expect.anything(), {
      presetNames: expect.arrayContaining(['core.link', 'core.page']),
    })
  })

  test('collectPresetsRegistryTelemetry does not log twice for the same registry', () => {
    registerRegistry('test-id')
    recordPresetUsage('test-id', 'core.link')

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
    recordPresetUsage('unknown-id', 'core.link')

    const {telemetry, logSpy} = createMockTelemetry()
    collectPresetsRegistryTelemetry('unknown-id', telemetry)
    expect(logSpy).not.toHaveBeenCalled()
  })

  test('records "unnamed" when preset has no identifier', () => {
    registerRegistry('test-id')
    recordPresetUsage('test-id', 'unnamed')

    const {telemetry, logSpy} = createMockTelemetry()
    collectPresetsRegistryTelemetry('test-id', telemetry)

    expect(logSpy).toHaveBeenCalledWith(expect.anything(), {
      presetNames: ['unnamed'],
    })
  })

  test('records mix of named and unnamed presets', () => {
    registerRegistry('test-id')
    recordPresetUsage('test-id', 'core.link')
    recordPresetUsage('test-id', 'unnamed')
    recordPresetUsage('test-id', 'core.page')

    const {telemetry, logSpy} = createMockTelemetry()
    collectPresetsRegistryTelemetry('test-id', telemetry)

    expect(logSpy).toHaveBeenCalledWith(expect.anything(), {
      presetNames: expect.arrayContaining(['core.link', 'unnamed', 'core.page']),
    })
  })
})
