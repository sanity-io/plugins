import {useMediaIndex} from '@sanity/ui'

export function useIsTooSmallForSplitScreen() {
  const index = useMediaIndex()
  return index <= 3
}
