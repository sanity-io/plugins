import {red} from '@sanity/color'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {Box, Inline, Text, Tooltip} from '@sanity/ui'
import type {FC} from 'react'
import {type FieldError} from 'react-hook-form'

type Props = {
  description?: string
  error?: FieldError
  label: string
  name: string
}

const errorIconStyle = {color: red[500].hex}

const FormFieldInputLabel: FC<Props> = (props: Props) => {
  const {description, error, label, name} = props

  return (
    <Box marginBottom={3}>
      {/* Label */}
      <Inline gap={2}>
        <Text as="label" htmlFor={name} size={1} weight="semibold">
          {label}
        </Text>

        {/* Error icon + tooltip */}
        {error && (
          <Text size={1}>
            <Tooltip
              content={
                <Box padding={2}>
                  <Text muted size={1}>
                    <ErrorOutlineIcon style={{...errorIconStyle, marginRight: '0.1em'}} />
                    {error.message}
                  </Text>
                </Box>
              }
              fallbackPlacements={['top', 'left']}
              placement="right"
              portal
            >
              <ErrorOutlineIcon style={errorIconStyle} />
            </Tooltip>
          </Text>
        )}
      </Inline>

      {/* Description */}
      {description && (
        <Box marginY={3}>
          <Text as="p" muted size={1}>
            {description}
          </Text>
        </Box>
      )}
    </Box>
  )
}

export default FormFieldInputLabel
