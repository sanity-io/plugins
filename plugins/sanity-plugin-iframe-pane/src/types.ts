export type IframeSizeKey = keyof SizeProps

export type Size = 'desktop' | 'mobile'

export type SizeProps = {
  [key in Size]: {
    width: string | number
    height: string | number
  }
}
