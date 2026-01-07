import {EarthAmericasIcon} from '@sanity/icons'
import {Button} from '@sanity/ui'
import {type ReactNode} from 'react'

import {allTimezones} from '../utils'

interface TimezoneButtonProps {
  onClick: () => void
  timezone: string
}

export const TimezoneButton = (props: TimezoneButtonProps): ReactNode => {
  const {onClick, timezone} = props
  const currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const label =
    allTimezones.find((tz) => tz.name === timezone)?.abbreviation ??
    allTimezones.find((tz) => tz.group.includes(timezone))?.abbreviation ??
    allTimezones.find((tz) => tz.name === currentTimezone)?.abbreviation ??
    allTimezones.find((tz) => tz.group.includes(currentTimezone))?.abbreviation

  return (
    <Button
      fontSize={1}
      style={{width: '100%'}}
      justify={'flex-start'}
      icon={EarthAmericasIcon}
      mode="ghost"
      onClick={onClick}
      text={`${label}`}
      aria-label="Select a timezone"
    />
  )
}
