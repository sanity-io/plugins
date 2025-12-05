import {defineType, type ObjectDefinition, type ObjectOptions} from 'sanity'

import {BynderDiff} from '../components/BynderDiff'

const bynderAssetSchemaName = 'bynder.asset' as const

type BynderAssetType = 'AUDIO' | 'DOCUMENT' | 'IMAGE' | 'VIDEO'

type BynderAssetFilterJson = {
  assetType_in?: BynderAssetType[] //predefined asset types
  collectionId?: string //predefined collection id
  metapropertyOptionId_in?: string[] //predefined metaproperty IDs
  searchTerm?: string //predefined search term
  tagNames_in?: string[] //predefined tags
  isLimitedUse?: boolean //whether or not this asset is marked as Limited Use
  showToolbar?: boolean //show toolbar for predefined filters (false by default)
}

export interface BynderAssetOptions extends ObjectOptions {
  assetTypes?: ('image' | 'video' | 'audio' | (string & {}))[]
  assetFilter?: BynderAssetFilterJson
}

/**
 * @public
 */
export interface BynderAssetDefinition extends Omit<
  ObjectDefinition,
  'type' | 'fields' | 'options'
> {
  type: typeof bynderAssetSchemaName
  options?: BynderAssetOptions
}

declare module 'sanity' {
  // makes type: 'bynder.asset' narrow correctly when using defineType/defineField/defineArrayMember
  export interface IntrinsicDefinitions {
    'bynder.asset': BynderAssetDefinition
  }
}

export interface BynderAssetValue {
  _type: typeof bynderAssetSchemaName
  _key?: string
  id?: string
  name?: string
  databaseId?: string
  type?: string
  previewUrl?: string
  previewImg?: string
  datUrl?: string
  description?: string
  aspectRatio?: number
  videoUrl?: string
  selectedUrl?: string
  width?: number
  height?: number
  /** Index signature to allow any additional Bynder asset fields */
  [key: string]: unknown
}

export const bynderAssetSchema: ObjectDefinition = defineType({
  name: bynderAssetSchemaName,
  type: 'object',
  title: 'Bynder Asset',
  fields: [
    {
      type: 'string',
      name: 'id',
    },
    {
      type: 'string',
      name: 'name',
    },
    {
      type: 'string',
      name: 'databaseId',
    },
    {
      type: 'string',
      name: 'type',
    },
    {
      type: 'string',
      name: 'previewUrl',
    },
    {
      type: 'string',
      name: 'previewImg',
    },
    {
      type: 'string',
      name: 'datUrl',
    },
    {
      type: 'string',
      name: 'description',
    },
    {
      type: 'number',
      name: 'aspectRatio',
    },
    {
      type: 'number',
      name: 'width',
    },
    {
      type: 'number',
      name: 'height',
    },
    {
      type: 'string',
      name: 'videoUrl',
    },
    {
      type: 'string',
      name: 'selectedUrl',
    },
  ],
  components: {
    diff: BynderDiff,
  },
})
