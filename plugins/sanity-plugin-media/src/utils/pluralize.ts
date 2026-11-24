import type {AssetType} from '../types'

// Every word this plugin pluralizes takes a plain "s"
export function pluralize(word: 'asset' | AssetType, count = 2): string {
  return count === 1 ? word : `${word}s`
}
