import {tz, TZDate} from '@date-fns/tz'
import {format} from 'date-fns/format'

import type {NormalizedTimeZone} from '../types'

/**
 * Formats `date` as seen in `timeZone`, using date-fns v4's `in` context
 * option with the official `@date-fns/tz` package (the replacement for
 * `date-fns-tz`'s `formatInTimeZone`).
 */
export const formatInTimeZone = (date: Date, timeZone: string, formatStr: string): string => {
  return format(date, formatStr, {in: tz(timeZone)})
}

/**
 * Returns the UTC instant whose wall-clock time in `toTimeZone` matches the
 * wall-clock time that `date` has in `fromTimeZone`. Reads the date components
 * in the source time zone and constructs a `TZDate` from them in the target
 * time zone, the same way sanity core re-interprets dates across time zones.
 * Replaces the `zonedTimeToUtc(formatInTimeZone(...))` round-trip previously
 * performed with `date-fns-tz`.
 */
export const shiftWallClockToTimeZone = (
  date: Date,
  fromTimeZone: string,
  toTimeZone: string,
): Date => {
  const wallClock = new TZDate(date, fromTimeZone)
  return new Date(
    +new TZDate(
      wallClock.getFullYear(),
      wallClock.getMonth(),
      wallClock.getDate(),
      wallClock.getHours(),
      wallClock.getMinutes(),
      wallClock.getSeconds(),
      wallClock.getMilliseconds(),
      toTimeZone,
    ),
  )
}

/* We have to "fake" a UTC date to make the datepicker look "right"
 * to the user. For example, if someone sets 7:00AM PST, which is 3PM UTC
 * and I am on the east coast, I want to have 12:00PM UTC, which will look like 7:00AM to me
 * In other words, UTC minus 3 hours, or (UTC(my offset - their offset))
 * this is purely cosmetic and should not be saved at all
 */
export const getConstructedUTCDate = (utc: string, offset: number): string => {
  const date = new Date(utc)
  const currentOffset = date.getTimezoneOffset() * -1
  const diff = currentOffset - offset
  const fakeUTCDate = new Date(date.getTime() - diff * 60 * 1000)
  return fakeUTCDate.toISOString()
}

interface TimeZoneInfo {
  abbreviation: string
  alternativeName: string
  offset: string
}

const timeZoneInfoCache = new Map<string, TimeZoneInfo>()

const getTimeZoneInfo = (timeZone: string): TimeZoneInfo => {
  const cached = timeZoneInfoCache.get(timeZone)
  if (cached) return cached

  const now = new Date()
  const longFormatter = new Intl.DateTimeFormat(undefined, {timeZone, timeZoneName: 'long'})
  const shortFormatter = new Intl.DateTimeFormat(undefined, {timeZone, timeZoneName: 'short'})
  const rawOffset = format(now, 'xxx', {in: tz(timeZone)})
  // If the offset is +02:00 then we can just show +2, if it has +13:45 then we
  // should show +13:45; remove the leading zero and the trailing :00, and drop
  // +0 entirely so UTC renders as plain "GMT"
  const offset = rawOffset
    .replace(/([+-])0(\d)/, '$1$2')
    .replace(/([+-])0$/, '$1')
    .replace(/:00$/, '')
    .replace(/[+]0$/, '')

  const info: TimeZoneInfo = {
    abbreviation:
      shortFormatter.formatToParts(now).find(({type}) => type === 'timeZoneName')?.value ?? '',
    alternativeName:
      longFormatter.formatToParts(now).find(({type}) => type === 'timeZoneName')?.value ?? '',
    offset,
  }
  timeZoneInfoCache.set(timeZone, info)
  return info
}

/**
 * Returns the localized abbreviation (e.g. `PST`, `GMT+2`) for any valid IANA
 * time zone name, or `undefined` when the name is not recognized by the
 * runtime.
 */
export const getTimeZoneAbbreviation = (timeZone: string): string | undefined => {
  try {
    return getTimeZoneInfo(timeZone).abbreviation
  } catch {
    return undefined
  }
}

/**
 * Resolves any valid IANA time zone name to the runtime's canonical
 * identifier, e.g. `Europe/Kyiv` to `Europe/Kiev` when the runtime lists the
 * latter. Documents written with older plugin versions may store alias
 * spellings that are absent from `Intl.supportedValuesOf('timeZone')`.
 * Returns `undefined` when the name is not recognized.
 */
export const resolveCanonicalTimeZone = (timeZone: string): string | undefined => {
  try {
    return new Intl.DateTimeFormat(undefined, {timeZone}).resolvedOptions().timeZone
  } catch {
    return undefined
  }
}

const offsetToMinutes = (offset: string): number => {
  if (!offset) return 0
  const multiplier = offset.startsWith('-') ? -1 : 1
  if (!offset.includes(':')) return multiplier * Number(offset.replace(/[+-]/, '')) * 60

  const [hours = 0, minutes = 0] = offset.replace(/[+-]/, '').split(':').map(Number)
  return multiplier * (hours * 60 + minutes)
}

let allTimezonesCache: NormalizedTimeZone[] | undefined

/**
 * Lists the IANA time zones known to the runtime, normalized for the timezone
 * selector. Mirrors how sanity core builds its time zone list from
 * `Intl.supportedValuesOf` instead of shipping a static time zone database.
 * Computed lazily and cached, as enumerating the time zones is expensive.
 */
export const getAllTimezones = (): NormalizedTimeZone[] => {
  if (allTimezonesCache) return allTimezonesCache

  allTimezonesCache = Intl.supportedValuesOf('timeZone')
    .flatMap((name): NormalizedTimeZone[] => {
      // Skip time zones without a city component (e.g. plain 'UTC'). The city
      // is the last segment: 'America/Indiana/Indianapolis' -> 'Indianapolis'
      const segments = name.split('/')
      const city = segments.length > 1 ? segments.at(-1) : undefined
      if (!city) return []

      const {abbreviation, alternativeName, offset} = getTimeZoneInfo(name)
      return [
        {
          abbreviation,
          alternativeName,
          city: city.replaceAll('_', ' '),
          // Main time zone name 'Africa/Dar_es_Salaam'
          name,
          // Time zone name with underscores removed
          namePretty: name.replaceAll('_', ' '),
          offset,
          // all searchable text - this is transformed before being rendered in `<AutoComplete>`
          value: `${offset} ${abbreviation} ${name} ${alternativeName}`,
        },
      ]
    })
    .sort((a, b) => offsetToMinutes(a.offset) - offsetToMinutes(b.offset))

  return allTimezonesCache
}
