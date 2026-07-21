import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Box, Text, Tooltip} from '@sanity/ui'
import {TextWithTone, type ValidationMarker} from 'sanity'

type ValidationStatusProps = {
  validation: ValidationMarker[]
}

export function ValidationStatus(props: ValidationStatusProps) {
  // oxlint-disable-next-line no-useless-default-assignment
  const {validation = []} = props

  if (!validation.length) {
    return null
  }

  const hasError = validation.some((item) => item.level === 'error')

  return (
    <Tooltip
      portal
      content={
        <Box padding={2}>
          <Text size={1}>
            {validation.length === 1
              ? `1 validation issue`
              : `${validation.length} validation issues`}
          </Text>
        </Box>
      }
    >
      <TextWithTone tone={hasError ? `critical` : `caution`} size={1}>
        {hasError ? <ErrorOutlineIcon /> : <WarningOutlineIcon />}
      </TextWithTone>
    </Tooltip>
  )
}
