import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {Box, Inline, Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'

type Props = {
  description?: string
  error?: string
  label: string
  name: string
}

const FormFieldInputLabel = (props: Props) => {
  const {description, error, label, name} = props
  const {color} = useThemeV2()

  return (
    <>
      {/* Label */}
      <Box marginY={3}>
        <Inline gap={2}>
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
                      <ErrorOutlineIcon
                        style={{color: color.avatar.red.bg, marginRight: '0.1em'}}
                      />
                      {error}
                    </Text>
                  </Box>
                }
                fallbackPlacements={['top', 'left']}
                placement="right"
                portal
              >
                <ErrorOutlineIcon style={{color: color.avatar.red.bg}} />
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
