import {type AssetSource, definePlugin} from 'sanity'

import {UnsplashIcon} from './components/Icon'
import Unsplash from './components/UnsplashAssetSource'

export type {Asset, AssetDocument, UnsplashPhoto} from './types'

/**
 * @public
 */
export const unsplashAssetSource: AssetSource = {
  name: 'unsplash',
  title: 'Unsplash',
  component: Unsplash,
  icon: UnsplashIcon,
}

/**
 * @public
 */
export const unsplashImageAsset = definePlugin({
  name: 'asset-source-unsplash-plugin',

  form: {
    image: {
      assetSources: (prev) => {
        return [...prev, unsplashAssetSource]
      },
    },
  },
})

export {UnsplashIcon}
