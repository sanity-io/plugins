import type {HslaColor, HsvaColor, RgbaColor} from '@uiw/react-color'

import {useCallback, useMemo} from 'react'
import {EditableInput, validHex} from '@uiw/react-color'
import {hexToHsva, rgbaToHsva} from '@uiw/react-color'

import {Box, Flex, useTheme} from '@sanity/ui'

interface ColorPickerFieldsProps {
  rgb?: RgbaColor
  hsl?: HslaColor
  hex?: string
  disableAlpha: boolean
  onChange: (color: HsvaColor) => void
}

export const ColorPickerFields = ({
  onChange,
  rgb,
  hex,
  disableAlpha,
}: ColorPickerFieldsProps) => {
  const {sanity} = useTheme()

  const inputStyle = useMemo(
    () => ({
      width: '100%',
      padding: '4px 10%',
      border: 'none',
      boxShadow: `inset 0 0 0 1px ${sanity.color.input.default.enabled.border}`,
      color: sanity.color.input.default.enabled.fg,
      backgroundColor: sanity.color.input.default.enabled.bg,
      fontSize: sanity.fonts.text.sizes[0]?.fontSize,
      textAlign: 'center' as const,
    }),
    [sanity],
  )

  const labelStyle = useMemo(
    () => ({
      display: 'block',
      textAlign: 'center' as const,
      fontSize: sanity.fonts.label.sizes[0]?.fontSize,
      color: sanity.color.base.fg,
      paddingTop: '3px',
      paddingBottom: '4px',
      textTransform: 'capitalize' as const,
    }),
    [sanity],
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, value: string | number) => {
      const name = e.target.name
      if (name === 'hex' && typeof value === 'string') {
        const hexValue = value.startsWith('#') ? value : `#${value}`
        if (validHex(hexValue)) {
          onChange(hexToHsva(hexValue))
        }
      } else if (rgb && (name === 'r' || name === 'g' || name === 'b')) {
        onChange(
          rgbaToHsva({
            r: name === 'r' ? Number(value) : rgb.r,
            g: name === 'g' ? Number(value) : rgb.g,
            b: name === 'b' ? Number(value) : rgb.b,
            a: rgb.a,
          }),
        )
      } else if (rgb && name === 'a') {
        let alpha = Number(value)
        if (alpha < 0) {
          alpha = 0
        } else if (alpha > 100) {
          alpha = 100
        }
        alpha /= 100

        onChange(
          rgbaToHsva({
            r: rgb.r,
            g: rgb.g,
            b: rgb.b,
            a: alpha,
          }),
        )
      }
    },
    [onChange, rgb],
  )

  return (
    <Flex>
      <Box flex={2} marginRight={1}>
        <EditableInput
          name="hex"
          label="hex"
          value={hex?.replace('#', '') ?? ''}
          onChange={handleChange}
          inputStyle={inputStyle}
          labelStyle={labelStyle}
        />
      </Box>
      <Box flex={1} marginRight={1}>
        <EditableInput
          name="r"
          label="r"
          value={rgb?.r ?? 0}
          onChange={handleChange}
          inputStyle={inputStyle}
          labelStyle={labelStyle}
        />
      </Box>
      <Box flex={1} marginRight={1}>
        <EditableInput
          name="g"
          label="g"
          value={rgb?.g ?? 0}
          onChange={handleChange}
          inputStyle={inputStyle}
          labelStyle={labelStyle}
        />
      </Box>
      <Box flex={1} marginRight={1}>
        <EditableInput
          name="b"
          label="b"
          value={rgb?.b ?? 0}
          onChange={handleChange}
          inputStyle={inputStyle}
          labelStyle={labelStyle}
        />
      </Box>
      {!disableAlpha && (
        <Box flex={1}>
          <EditableInput
            name="a"
            label="a"
            value={Math.round((rgb?.a ?? 1) * 100)}
            onChange={handleChange}
            inputStyle={inputStyle}
            labelStyle={labelStyle}
          />
        </Box>
      )}
    </Flex>
  )
}
