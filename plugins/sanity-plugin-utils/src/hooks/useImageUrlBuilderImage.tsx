import type {SanityImageSource} from '@sanity/image-url'
import {useMemo} from 'react'
import type {ImageUrlBuilder, SourceClientOptions} from 'sanity'

import {useImageUrlBuilder} from './useImageUrlBuilder'

export function useImageUrlBuilderImage(
  source: SanityImageSource,
  clientOptions: SourceClientOptions,
): ImageUrlBuilder | null {
  const builder = useImageUrlBuilder(clientOptions)
  const image = useMemo(() => (source && builder ? builder.image(source) : null), [builder, source])

  return image
}
