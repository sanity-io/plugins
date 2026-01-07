import {formatInTimeZone, getTimezoneOffset, zonedTimeToUtc} from 'date-fns-tz'
import {type ReactNode, useCallback} from 'react'
import {DateTimeInput, type FieldProps, type FormPatch, type PatchEvent, set, unset} from 'sanity'

import type {RichDate} from '../types'

import {getConstructedUTCDate, unlocalizeDateTime} from '../utils'

interface RelativeDateTimePickerProps extends Omit<FieldProps, 'renderDefault'> {
  dateValue?: RichDate
}
export const RelativeDateTimePicker = (props: RelativeDateTimePickerProps): ReactNode => {
  const {
    dateValue: value,
    inputProps: {onChange},
  } = props

  const handleDateChange = useCallback(
    (patch: FormPatch | PatchEvent | FormPatch[]) => {
      const formatter = new Intl.DateTimeFormat()
      const timezone = value?.timezone ?? formatter.resolvedOptions().timeZone

      // Type guard to check if patch is a set patch with a value
      if (
        !patch ||
        Array.isArray(patch) ||
        !('type' in patch) ||
        patch.type !== 'set' ||
        !('value' in patch) ||
        typeof patch.value !== 'string'
      ) {
        onChange(unset())
        return
      }

      const newDatetime = patch.value

      /* get what time the user "meant" to set without tz info
       * right now, newDatetime is the time the user set plus
       * their current offset, not the timezone offset
       */
      const desiredDateTime = unlocalizeDateTime(newDatetime, formatter.resolvedOptions().timeZone)

      const newUtcDateObject = zonedTimeToUtc(desiredDateTime, timezone)
      // offset may have changed based on DST, capture that
      const newOffset = getTimezoneOffset(timezone, newUtcDateObject) / 60 / 1000
      const localDate = formatInTimeZone(newUtcDateObject, timezone, "yyyy-MM-dd'T'HH:mm:ssXXX")

      const patches = []

      patches.push(set(newUtcDateObject.toISOString(), ['utc']))
      patches.push(set(localDate, ['local']))

      if (!value?.timezone) {
        patches.push(set(timezone, ['timezone']))
      }

      if (value?.offset !== newOffset) {
        patches.push(set(newOffset, ['offset']))
      }

      onChange(patches)
    },
    [onChange, value],
  )

  // Dynamically calculate the offset for the actual event date to handle DST correctly
  const displayOffset =
    value?.utc && value?.timezone
      ? getTimezoneOffset(value.timezone, new Date(value.utc)) / 60 / 1000
      : (value?.offset ?? 0)

  const dateToDisplay = value?.utc ? getConstructedUTCDate(value.utc, displayOffset) : ''

  // @ts-expect-error -- slight mismatch in elementProps and renderDefault, but should line up in practice
  return <DateTimeInput {...props} onChange={handleDateChange} value={dateToDisplay} />
}
