import type {Asset, FileAsset, ImageAsset} from '../types'

export const isFileAsset = (asset: Asset): asset is FileAsset => {
  return asset._type === 'sanity.fileAsset'
}

export const isImageAsset = (asset: Asset): asset is ImageAsset => {
  return asset._type === 'sanity.imageAsset'
}
