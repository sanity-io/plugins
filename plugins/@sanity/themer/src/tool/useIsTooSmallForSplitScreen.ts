import {useMediaIndex} from '@sanity/ui'

import {MIN_MEDIA_INDEX_FOR_SPLIT_SCREEN} from '#constants'

export function useIsTooSmallForSplitScreen() {
  const index = useMediaIndex()
  return index <= MIN_MEDIA_INDEX_FOR_SPLIT_SCREEN
}
