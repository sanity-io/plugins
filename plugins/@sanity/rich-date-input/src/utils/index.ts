import {getTimeZones} from '@vvo/tzdb'
import {formatInTimeZone} from 'date-fns-tz'

import {NormalizedTimeZone} from '../types'

export const unlocalizeDateTime = (datetime: string, timezone: string): string => {
  return formatInTimeZone(datetime, timezone, 'yyyy-MM-dd HH:mm:ss')
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

//keep some consistency with scheduled publishing
//https://github.com/sanity-io/sanity-plugin-scheduled-publishing/blob/bb282e3df9a8a73df37fab8ee1fdd0e2430745be/src/hooks/useTimeZone.tsx#L17
export const allTimezones = getTimeZones().map((tz) => {
  return {
    abbreviation: tz.abbreviation,
    alternativeName: tz.alternativeName,
    mainCities: tz.mainCities.join(', '),
    // Main time zone name 'Africa/Dar_es_Salaam'
    name: tz.name,
    // Time zone name with underscores removed
    namePretty: tz.name.replaceAll('_', ' '),
    offset: tz.currentTimeFormat.split(' ')[0],
    // all searchable text - this is transformed before being rendered in `<AutoComplete>`
    value: `${tz.currentTimeFormat} ${tz.abbreviation} ${tz.name}`,
    currentTimeOffsetInMinutes: tz.currentTimeOffsetInMinutes,
    group: tz.group,
  } as NormalizedTimeZone
})
