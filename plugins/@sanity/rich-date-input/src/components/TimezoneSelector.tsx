import {SearchIcon} from '@sanity/icons'
import {Autocomplete, Box, Card, Text} from '@sanity/ui'
import {formatInTimeZone, getTimezoneOffset, zonedTimeToUtc} from 'date-fns-tz'
import {type ReactNode, useCallback} from 'react'
import {ObjectInputProps, set} from 'sanity'

import {NormalizedTimeZone, RichDate} from '../types'
import {allTimezones, unlocalizeDateTime} from '../utils'

interface TimezoneSelectorProps {
  onChange: Pick<ObjectInputProps, 'onChange'>['onChange']
  value?: RichDate
}

export const TimezoneSelector = (props: TimezoneSelectorProps): ReactNode => {
  const {onChange, value} = props
  const currentTz = allTimezones.find((tz) => tz.name === value?.timezone)
  const userTzName = Intl.DateTimeFormat().resolvedOptions().timeZone
  const userTz = (allTimezones.find((tz) => tz.name === userTzName) ??
    allTimezones.find((tz) => tz.group.includes(userTzName)))!

  const handleTimezoneChange = useCallback(
    (selectedTz: string) => {
      const newTimezone =
        allTimezones.find((tz) => tz.value === selectedTz) ?? (userTz as NormalizedTimeZone)

      const timezonePatch = set(newTimezone.name, ['timezone'])
      const patches = [timezonePatch]

      // then, recalculate UTC and local from "old" time with the new offset
      if (value?.utc) {
        const desiredDateTime = unlocalizeDateTime(value.utc, value.timezone)
        const newUtcDateObject = zonedTimeToUtc(desiredDateTime, newTimezone.name)
        const newOffset = getTimezoneOffset(newTimezone.name, newUtcDateObject) / 60 / 1000
        const newLocalDate = formatInTimeZone(
          newUtcDateObject.toISOString(),
          newTimezone.name,
          "yyyy-MM-dd'T'HH:mm:ssXXX",
        )
        patches.push(set(newUtcDateObject.toISOString(), ['utc']))
        patches.push(set(newLocalDate, ['local']))
        patches.push(set(newOffset, ['offset']))
      }
      onChange(patches)
    },
    [onChange, userTz, value],
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
          boundaryElement: document.querySelector('body'),
          constrainSize: true,
          placement: 'bottom-start',
        }}
        // eslint-disable-next-line react/jsx-no-bind
        renderOption={(option) => {
          return (
            <Card as="button" padding={3}>
              <Text size={1} textOverflow="ellipsis">
                <span>GMT{option.offset}</span>
                <span style={{fontWeight: 500, marginLeft: '1em'}}>{option.alternativeName}</span>
                <span style={{marginLeft: '1em'}}>{option.mainCities}</span>
              </Text>
            </Card>
          )
        }}
        // eslint-disable-next-line react/jsx-no-bind
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
