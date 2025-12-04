import {lazy} from 'react'

export {bynderInputPlugin} from './plugin'

export const BynderInput = lazy(() => import('./components/BynderInput'))

export type {BynderConfig, BynderInputProps} from './components/BynderInput'
export {BynderDiff} from './components/BynderDiff'
export {
  bynderAssetSchema,
  type BynderAssetValue,
  type BynderAssetOptions,
  type BynderAssetDefinition,
} from './schema/bynder.asset'
