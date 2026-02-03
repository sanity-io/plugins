import type {HslaColor, HsvaColor, RgbaColor} from '@uiw/react-color'
import type {ObjectInputProps, ObjectOptions, ObjectSchemaType} from 'sanity'

export interface ColorValue {
  hex: string
  hsl: HslaColor
  hsv: HsvaColor
  rgb: RgbaColor
}

export interface ColorOptions extends Omit<ObjectOptions, 'columns'> {
  disableAlpha?: boolean
  colorList?: Array<string | ColorValue>
}

export type ColorSchemaType = Omit<ObjectSchemaType, 'options'> & {
  options?: ColorOptions
}
export type ColorInputProps = ObjectInputProps<ColorValue, ColorSchemaType>
