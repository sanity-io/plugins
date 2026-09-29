import {useMediaIndex} from '@sanity/ui'

export function useIsMobile() {
  const index = useMediaIndex()
  return index <= 2
}
