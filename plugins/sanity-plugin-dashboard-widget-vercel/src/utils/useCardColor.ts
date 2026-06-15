import {useTheme_v2} from '@sanity/ui'

export function useCardColor(): {border: string} {
  const {color} = useTheme_v2()
  return {border: color.border}
}
