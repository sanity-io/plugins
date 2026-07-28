import {Box, Flex, useTheme_v2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {useCallback} from 'react'

import {
  type Color,
  type ColorChangeHandler,
  EditableInput,
  type HSLColor,
  isValidHex,
  type RGBColor,
} from './react-color'

import {
  inputBgVar,
  inputBorderVar,
  inputFgVar,
  inputFontSizeVar,
  labelFgVar,
  labelFontSizeVar,
} from './react-color/EditableInput.css'

interface ColorPickerFieldsProps {
  rgb?: RGBColor
  hsl?: HSLColor
  hex?: string
  disableAlpha: boolean
  onChange: ColorChangeHandler<Color>
}

export const ColorPickerFields = ({
  onChange,
  rgb,
  hsl,
  hex,
  disableAlpha,
}: ColorPickerFieldsProps): React.JSX.Element => {
  const {color, font} = useTheme_v2()
  const inputEnabled = color.input.default.enabled
  const textFontSize = font.text.sizes[0]?.fontSize
  const labelFontSize = font.label.sizes[0]?.fontSize

  const handleChange: ColorChangeHandler<Record<string, string>> = useCallback(
    (data) => {
      if ('hex' in data && data['hex'] && isValidHex(data['hex'])) {
        onChange({
          hex: data['hex'],
          source: 'hex',
        })
      } else if (
        rgb &&
        (('r' in data && data['r']) || ('g' in data && data['g']) || ('b' in data && data['b']))
      ) {
        onChange({
          r: Number(data['r']) || rgb.r,
          g: Number(data['g']) || rgb.g,
          b: Number(data['b']) || rgb.b,
          a: rgb.a,
          source: 'rgb',
        })
      } else if (hsl && 'a' in data && data['a']) {
        let alpha = Number(data['a'])
        if (alpha < 0) {
          alpha = 0
        } else if (alpha > 100) {
          alpha = 100
        }
        alpha /= 100

        onChange({
          h: hsl.h,
          s: hsl.s,
          l: hsl.l,
          a: alpha,
          source: 'hsl',
        })
      }
    },
    [onChange, hsl, rgb],
  )

  return (
    <Flex
      style={assignInlineVars({
        [inputBorderVar]: inputEnabled.border,
        [inputFgVar]: inputEnabled.fg,
        [inputBgVar]: inputEnabled.bg,
        [inputFontSizeVar]: textFontSize === undefined ? undefined : `${textFontSize}px`,
        [labelFontSizeVar]: labelFontSize === undefined ? undefined : `${labelFontSize}px`,
        [labelFgVar]: color.fg,
      })}
    >
      <Box flex={2} marginRight={1}>
        <EditableInput label="hex" value={hex?.replace('#', '')} onChange={handleChange} />
      </Box>
      <Box flex={1} marginRight={1}>
        <EditableInput label="r" value={rgb?.r} onChange={handleChange} dragLabel dragMax={255} />
      </Box>
      <Box flex={1} marginRight={1}>
        <EditableInput label="g" value={rgb?.g} onChange={handleChange} dragLabel dragMax={255} />
      </Box>
      <Box flex={1} marginRight={1}>
        <EditableInput label="b" value={rgb?.b} onChange={handleChange} dragLabel dragMax={255} />
      </Box>
      {!disableAlpha && (
        <Box flex={1}>
          <EditableInput
            label="a"
            value={Math.round((rgb?.a ?? 1) * 100)}
            onChange={handleChange}
            dragLabel
            dragMax={100}
          />
        </Box>
      )}
    </Flex>
  )
}
