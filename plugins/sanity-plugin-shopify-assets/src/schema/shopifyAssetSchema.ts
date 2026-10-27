import {defineField, defineType} from 'sanity'

import AssetDiff from '../components/AssetDiff'
import AssetPreview from '../components/AssetPreview'
import ShopifyAssetInput from '../components/ShopifyAssetInput'
import type {PluginConfig} from '../types'

declare module 'sanity' {
  interface ObjectOptions {
    shopifyDomain?: string
    dataset?: string
  }
}

export const shopifyAssetSchema = (config: PluginConfig) => {
  const {shopifyDomain} = config
  const dataset = config.dataset?.trim()

  return defineType({
    type: 'object',
    name: 'shopify.asset',
    title: 'Shopify Asset',
    options: {
      shopifyDomain,
      ...(dataset ? {dataset} : {}),
    },
    fields: [
      defineField({
        type: 'string',
        name: 'filename',
        title: 'Filename',
      }),
      defineField({
        type: 'string',
        name: 'id',
        title: 'ID',
      }),
      defineField({
        type: 'shopify.assetMetadata',
        name: 'meta',
        title: 'Metadata',
      }),
      defineField({
        type: 'shopify.assetPreview',
        name: 'preview',
        title: 'Preview',
      }),
      defineField({
        type: 'string',
        name: 'type',
        title: 'Type',
      }),
      defineField({
        type: 'url',
        name: 'url',
        title: 'URL',
      }),
    ],
    ...({
      components: {
        input: ShopifyAssetInput,
        diff: AssetDiff,
        preview: AssetPreview,
      },
    } as {}),
    preview: {
      select: {
        meta: 'meta',
        preview: 'preview',
        url: 'url',
        filename: 'filename',
        type: 'type',
      },
      prepare({url, meta, preview, filename, type}) {
        return {
          title: filename,
          subtitle: type,
          value: {
            url,
            meta,
            preview,
            filename,
          },
        }
      },
    },
  })
}
