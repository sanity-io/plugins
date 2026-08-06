import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {Box, Inline, Text, Tooltip, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx/lite'
import {type ComponentProps} from 'react'

import {errorIconColorVar, errorOutlineIcon} from './FormFieldInputLabel.css'

type Props = {
  description?: string
  error?: string
  label: string
  name: string
}

function StyledErrorOutlineIcon({
  className,
  style,
  ...props
}: ComponentProps<typeof ErrorOutlineIcon>) {
  const {color} = useThemeV2()

  return (
    <ErrorOutlineIcon
      {...props}
      className={clsx(errorOutlineIcon, className)}
      style={{...style, ...assignInlineVars({[errorIconColorVar]: color.avatar.red.bg})}}
    />
  )
}

const FormFieldInputLabel = (props: Props) => {
  const {description, error, label, name} = props

  return (
    <>
      {/* Label */}
      <Box marginY={3}>
        <Inline space={2}>
          <Text as="label" htmlFor={name} size={1} weight="semibold">
            {label}
          </Text>

          {/* Error icon + tooltip */}
          {error && (
            <Text size={1}>
              <Tooltip
                animate
                content={
                  <Box padding={2}>
                    <Text muted size={1}>
                      <StyledErrorOutlineIcon style={{marginRight: '0.1em'}} />
                      {error}
                    </Text>
                  </Box>
                }
                fallbackPlacements={['top', 'left']}
                placement="right"
                portal
              >
                <StyledErrorOutlineIcon />
              </Tooltip>
            </Text>
          )}
        </Inline>
      </Box>

      {/* Description */}
      {description && (
        <Box marginY={3}>
          <Text as="label" htmlFor={name} muted size={1}>
            {description}
          </Text>
        </Box>
      )}
    </>
  )
}

export default FormFieldInputLabel
