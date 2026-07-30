import {createSelector} from '@reduxjs/toolkit'

import type {CardAssetData, CardUploadData} from '../types'
import type {RootReducerState} from './types'

export const selectCombinedItems = createSelector(
  [
    (state: RootReducerState) => state.assets.allIds,
    (state: RootReducerState) => state.uploads.allIds,
  ],
  (assetIds, uploadIds) => {
    const assetItems = assetIds.map((id): CardAssetData => ({id, type: 'asset'}))
    const uploadItems = uploadIds.map((id): CardUploadData => ({id, type: 'upload'}))
    const combinedItems: (CardAssetData | CardUploadData)[] = [...uploadItems, ...assetItems]
    return combinedItems
  },
)
