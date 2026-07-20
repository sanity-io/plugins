import {EarthAmericasIcon} from '@sanity/icons/EarthAmericas'
import {Button} from '@sanity/ui'
import {type ReactNode} from 'react'

import {getTimeZoneAbbreviation} from '../utils'

interface TimezoneButtonProps {
  onClick: () => void
  timezone: string
}

export const TimezoneButton = (props: TimezoneButtonProps): ReactNode => {
  const {onClick, timezone} = props
  const formatter = new Intl.DateTimeFormat()
  const currentTimezone = formatter.resolvedOptions().timeZone

  const label = getTimeZoneAbbreviation(timezone) ?? getTimeZoneAbbreviation(currentTimezone)

  return (
    <Button
      fontSize={1}
      style={{width: '100%'}}
      justify={'flex-start'}
      icon={EarthAmericasIcon}
      mode="ghost"
      onClick={onClick}
      text={label ?? timezone}
      aria-label="Select a timezone"
    />
  )
}
