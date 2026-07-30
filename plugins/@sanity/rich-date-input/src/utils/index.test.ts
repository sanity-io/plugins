import {describe, expect, test} from 'vitest'

import {
  formatInTimeZone,
  getAllTimezones,
  getConstructedUTCDate,
  getTimeZoneAbbreviation,
  resolveCanonicalTimeZone,
  shiftWallClockToTimeZone,
} from './index'

describe('shiftWallClockToTimeZone', () => {
  test('keeps the wall clock while changing the time zone', () => {
    // 12:00 UTC wall clock re-interpreted as 12:00 in Tokyo (UTC+9) is 03:00 UTC
    expect(
      shiftWallClockToTimeZone(
        new Date('2026-01-15T12:00:00.000Z'),
        'UTC',
        'Asia/Tokyo',
      ).toISOString(),
    ).toBe('2026-01-15T03:00:00.000Z')
  })

  test('respects DST of the target time zone', () => {
    // 12:00 UTC wall clock as 12:00 in Los Angeles: PST (-8) in winter, PDT (-7) in summer
    expect(
      shiftWallClockToTimeZone(
        new Date('2026-01-15T12:00:00.000Z'),
        'UTC',
        'America/Los_Angeles',
      ).toISOString(),
    ).toBe('2026-01-15T20:00:00.000Z')
    expect(
      shiftWallClockToTimeZone(
        new Date('2026-07-15T12:00:00.000Z'),
        'UTC',
        'America/Los_Angeles',
      ).toISOString(),
    ).toBe('2026-07-15T19:00:00.000Z')
  })

  test('converts between two non-UTC time zones', () => {
    // 03:00 UTC is 12:00 wall clock in Tokyo; 12:00 wall clock in Oslo (CET, +1) is 11:00 UTC
    expect(
      shiftWallClockToTimeZone(
        new Date('2026-01-15T03:00:00.000Z'),
        'Asia/Tokyo',
        'Europe/Oslo',
      ).toISOString(),
    ).toBe('2026-01-15T11:00:00.000Z')
  })

  test('is the identity when both time zones are the same', () => {
    const date = new Date('2026-04-02T13:37:42.000Z')
    expect(shiftWallClockToTimeZone(date, 'Europe/Oslo', 'Europe/Oslo').toISOString()).toBe(
      date.toISOString(),
    )
  })
})

describe('formatInTimeZone', () => {
  test('formats an instant as seen from the given time zone', () => {
    const date = new Date('2026-01-15T12:00:00.000Z')
    expect(formatInTimeZone(date, 'Asia/Tokyo', "yyyy-MM-dd'T'HH:mm:ssXXX")).toBe(
      '2026-01-15T21:00:00+09:00',
    )
    expect(formatInTimeZone(date, 'America/New_York', "yyyy-MM-dd'T'HH:mm:ssXXX")).toBe(
      '2026-01-15T07:00:00-05:00',
    )
  })
})

describe('getAllTimezones', () => {
  test('normalizes the runtime time zone list', () => {
    const timezones = getAllTimezones()

    const oslo = timezones.find((tz) => tz.name === 'Europe/Oslo')
    expect(oslo).toBeDefined()
    expect(oslo?.city).toBe('Oslo')
    expect(oslo?.namePretty).toBe('Europe/Oslo')

    // Underscores in names are prettified
    const dar = timezones.find((tz) => tz.name === 'Africa/Dar_es_Salaam')
    expect(dar?.city).toBe('Dar es Salaam')
    expect(dar?.namePretty).toBe('Africa/Dar es Salaam')

    // Offsets follow sanity core's compact format: '', '+2', '-8', '+5:30', ...
    for (const tz of timezones) {
      expect(tz.offset).toMatch(/^([+-]\d{1,2}(:\d{2})?)?$/)
      expect(tz.value).toContain(tz.name)
    }
  })

  test('skips time zones without a city component', () => {
    expect(getAllTimezones().some((tz) => !tz.name.includes('/'))).toBe(false)
  })

  test('uses the last segment as the city for multi-segment names', () => {
    const multiSegment = getAllTimezones().filter((tz) => tz.name.split('/').length > 2)
    expect(multiSegment.length).toBeGreaterThan(0)
    for (const tz of multiSegment) {
      expect(tz.city).toBe(tz.name.split('/').at(-1)?.replaceAll('_', ' '))
    }
  })
})

describe('resolveCanonicalTimeZone', () => {
  test('maps aliases to identifiers present in the time zone list', () => {
    const names = new Set(getAllTimezones().map((tz) => tz.name))
    // Alias spellings stored by older plugin versions (via @vvo/tzdb) that the
    // runtime may not list under the same name
    for (const alias of ['Asia/Kolkata', 'Europe/Kyiv']) {
      const canonical = resolveCanonicalTimeZone(alias)
      expect(canonical).toBeTruthy()
      expect(names.has(alias) || names.has(canonical!)).toBe(true)
    }
  })

  test('returns undefined for unknown names', () => {
    expect(resolveCanonicalTimeZone('Not/AZone')).toBeUndefined()
  })
})

describe('getTimeZoneAbbreviation', () => {
  test('resolves any valid IANA name, including aliases outside the list', () => {
    expect(getTimeZoneAbbreviation('Asia/Tokyo')).toBeTruthy()
    // Alias for Asia/Kolkata that may not be in Intl.supportedValuesOf
    expect(getTimeZoneAbbreviation('Asia/Calcutta')).toBeTruthy()
  })

  test('returns undefined for unknown names', () => {
    expect(getTimeZoneAbbreviation('')).toBeUndefined()
    expect(getTimeZoneAbbreviation('Not/AZone')).toBeUndefined()
  })
})

describe('getConstructedUTCDate', () => {
  test('offsets the UTC date by the difference to the system offset', () => {
    const utc = '2026-01-15T12:00:00.000Z'
    const systemOffset = new Date(utc).getTimezoneOffset() * -1
    // Target offset equal to the system offset should be the identity
    expect(getConstructedUTCDate(utc, systemOffset)).toBe(new Date(utc).toISOString())
    // One hour further east shifts the "fake" UTC date one hour forward
    expect(getConstructedUTCDate(utc, systemOffset + 60)).toBe(
      new Date(new Date(utc).getTime() + 60 * 60 * 1000).toISOString(),
    )
  })
})
