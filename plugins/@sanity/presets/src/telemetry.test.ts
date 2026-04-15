import {afterEach, describe, expect, test, vi} from 'vitest'

import {
  _clearAllRegistriesForTesting,
  collectPresetsRegistryTelemetry,
  recordPresetUsage,
  registerRegistry,
} from './telemetry'

function createMockTelemetry() {
  return {log: vi.fn()} as {log: ReturnType<typeof vi.fn>}
}

describe('telemetry', () => {
  afterEach(() => {
    _clearAllRegistriesForTesting()
  })

  test('registerRegistry creates a new registry record', () => {
    registerRegistry('test-id')
    recordPresetUsage('test-id', 'core.presets.link')

    const telemetry = createMockTelemetry()
    // oxlint-disable-next-line no-unsafe-type-assertion -- mock telemetry
    collectPresetsRegistryTelemetry('test-id', telemetry as never)

    expect(telemetry.log).toHaveBeenCalledOnce()
  })

  test('recordPresetUsage adds the identifier to the registry set', () => {
    registerRegistry('test-id')
    recordPresetUsage('test-id', 'core.presets.link')
    recordPresetUsage('test-id', 'core.presets.cta')
    recordPresetUsage('test-id', 'core.presets.link')

    const telemetry = createMockTelemetry()
    // oxlint-disable-next-line no-unsafe-type-assertion -- mock telemetry
    collectPresetsRegistryTelemetry('test-id', telemetry as never)

    expect(telemetry.log).toHaveBeenCalledWith(expect.anything(), {
      presetNames: expect.arrayContaining(['core.presets.link', 'core.presets.cta']),
    })
    // oxlint-disable-next-line no-unsafe-type-assertion -- mock call args
    const callArgs = telemetry.log.mock.calls[0]?.[1] as {presetNames: string[]} | undefined
    expect(callArgs?.presetNames).toHaveLength(2)
  })

  test('collectPresetsRegistryTelemetry logs all recorded preset names', () => {
    registerRegistry('test-id')
    recordPresetUsage('test-id', 'core.presets.link')
    recordPresetUsage('test-id', 'core.presets.page')

    const telemetry = createMockTelemetry()
    // oxlint-disable-next-line no-unsafe-type-assertion -- mock telemetry
    collectPresetsRegistryTelemetry('test-id', telemetry as never)

    expect(telemetry.log).toHaveBeenCalledOnce()
    expect(telemetry.log).toHaveBeenCalledWith(expect.anything(), {
      presetNames: expect.arrayContaining(['core.presets.link', 'core.presets.page']),
    })
  })

  test('collectPresetsRegistryTelemetry does not log twice for the same registry', () => {
    registerRegistry('test-id')
    recordPresetUsage('test-id', 'core.presets.link')

    const telemetry = createMockTelemetry()
    // oxlint-disable-next-line no-unsafe-type-assertion -- mock telemetry
    collectPresetsRegistryTelemetry('test-id', telemetry as never)
    // oxlint-disable-next-line no-unsafe-type-assertion -- mock telemetry
    collectPresetsRegistryTelemetry('test-id', telemetry as never)
    // oxlint-disable-next-line no-unsafe-type-assertion -- mock telemetry
    collectPresetsRegistryTelemetry('test-id', telemetry as never)

    expect(telemetry.log).toHaveBeenCalledOnce()
  })

  test('collectPresetsRegistryTelemetry is a no-op for unknown registry id', () => {
    const telemetry = createMockTelemetry()
    // oxlint-disable-next-line no-unsafe-type-assertion -- mock telemetry
    collectPresetsRegistryTelemetry('unknown-id', telemetry as never)

    expect(telemetry.log).not.toHaveBeenCalled()
  })

  test('collectPresetsRegistryTelemetry does not log when no presets were recorded', () => {
    registerRegistry('test-id')

    const telemetry = createMockTelemetry()
    // oxlint-disable-next-line no-unsafe-type-assertion -- mock telemetry
    collectPresetsRegistryTelemetry('test-id', telemetry as never)

    expect(telemetry.log).not.toHaveBeenCalled()
  })

  test('recordPresetUsage is a no-op for unknown registry id', () => {
    recordPresetUsage('unknown-id', 'core.presets.link')

    const telemetry = createMockTelemetry()
    // oxlint-disable-next-line no-unsafe-type-assertion -- mock telemetry
    collectPresetsRegistryTelemetry('unknown-id', telemetry as never)
    expect(telemetry.log).not.toHaveBeenCalled()
  })
})
