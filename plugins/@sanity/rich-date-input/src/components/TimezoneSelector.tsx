import {tzOffset} from '@date-fns/tz'
import {SearchIcon} from '@sanity/icons/Search'
import {Autocomplete, Box, Card, Text} from '@sanity/ui'
import {type ReactNode, useCallback, useMemo} from 'react'
import {type ObjectInputProps, set} from 'sanity'

import type {RichDate} from '../types'
import {
  formatInTimeZone,
  getAllTimezones,
  resolveCanonicalTimeZone,
  shiftWallClockToTimeZone,
} from '../utils'

interface TimezoneSelectorProps {
  onChange: Pick<ObjectInputProps, 'onChange'>['onChange']
  value?: RichDate
}

export const TimezoneSelector = (props: TimezoneSelectorProps): ReactNode => {
  const {onChange, value} = props
  const allTimezones = useMemo(() => getAllTimezones(), [])
  // Stored names may be aliases the runtime does not list (e.g. 'Europe/Kyiv'
  // vs 'Europe/Kiev'), so fall back to matching on the canonical identifier
  const canonicalStoredTz = value?.timezone ? resolveCanonicalTimeZone(value.timezone) : undefined
  const currentTz =
    allTimezones.find((tz) => tz.name === value?.timezone) ??
    allTimezones.find((tz) => tz.name === canonicalStoredTz)
  const formatter = new Intl.DateTimeFormat()
  const userTzName = formatter.resolvedOptions().timeZone
  const userTz = (allTimezones.find((tz) => tz.name === userTzName) ??
    allTimezones.find((tz) => tz.abbreviation === 'GMT') ??
    allTimezones[0])!

  const handleTimezoneChange = useCallback(
    (selectedTz: string) => {
      const newTimezone = allTimezones.find((tz) => tz.value === selectedTz) ?? userTz

      const timezonePatch = set(newTimezone.name, ['timezone'])
      const patches = [timezonePatch]

      // then, recalculate UTC and local from "old" time with the new offset
      if (value?.utc) {
        const newUtcDateObject = shiftWallClockToTimeZone(
          new Date(value.utc),
          value.timezone,
          newTimezone.name,
        )
        const newOffset = tzOffset(newTimezone.name, newUtcDateObject)
        const newLocalDate = formatInTimeZone(
          newUtcDateObject,
          newTimezone.name,
          "yyyy-MM-dd'T'HH:mm:ssXXX",
        )
        patches.push(set(newUtcDateObject.toISOString(), ['utc']))
        patches.push(set(newLocalDate, ['local']))
        patches.push(set(newOffset, ['offset']))
      }
      onChange(patches)
    },
    [allTimezones, onChange, userTz, value],
  )

  return (
    // taken from Scheduled Publishing, again!
    // https://github.com/sanity-io/sanity-plugin-scheduled-publishing/blob/bb282e3df9a8a73df37fab8ee1fdd0e2430745be/src/components/dialogs/DialogTimeZone.tsx#L100
    <Box padding={4}>
      <Autocomplete
        fontSize={2}
        icon={SearchIcon}
        id="timezone"
        onChange={handleTimezoneChange}
        openButton
        options={allTimezones}
        padding={4}
        placeholder="Search for a city or time zone"
        popover={{
          floatingBoundary: document.body,
          referenceBoundary: document.body,
          constrainSize: true,
          placement: 'bottom-start',
        }}
        renderOption={(option) => {
          return (
            <Card as="button" padding={3}>
              <Text size={1} textOverflow="ellipsis">
                <span>GMT{option.offset}</span>
                <span style={{fontWeight: 500, marginLeft: '1em'}}>{option.alternativeName}</span>
                <span style={{marginLeft: '1em'}}>{option.city}</span>
              </Text>
            </Card>
          )
        }}
        renderValue={(_, option) => {
          if (!option) return ''
          return `${option.alternativeName} (${option.namePretty})`
        }}
        tabIndex={-1}
        value={currentTz?.value ?? userTz.value}
      />
    </Box>
  )
}
