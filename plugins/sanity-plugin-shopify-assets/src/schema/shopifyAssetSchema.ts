import {lazy} from 'react'
import {defineField, defineType} from 'sanity'

import AssetPreview from '../components/AssetPreview'
import type {PluginConfig} from '../types'

// Both import `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`, which must
// stay out of what the studio shell loads.
const AssetDiff = lazy(() => import('../components/AssetDiff'))
const ShopifyAssetInput = lazy(() => import('../components/ShopifyAssetInput'))

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
