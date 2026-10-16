import {expect, test} from 'vitest'

import {shopifyAssetSchema} from './shopifyAssetSchema'

test('stores a trimmed plugin dataset on the asset type', () => {
  const schemaType = shopifyAssetSchema({
    shopifyDomain: 'example.myshopify.com',
    dataset: ' production ',
  })

  expect(schemaType.options).toEqual({
    shopifyDomain: 'example.myshopify.com',
    dataset: 'production',
  })
})

test('omits dataset when the plugin does not set one', () => {
  const schemaType = shopifyAssetSchema({
    shopifyDomain: 'example.myshopify.com',
  })

  expect(schemaType.options).toEqual({
    shopifyDomain: 'example.myshopify.com',
  })
})

test('omits a blank plugin dataset', () => {
  const schemaType = shopifyAssetSchema({
    shopifyDomain: 'example.myshopify.com',
    dataset: '  ',
  })

  expect(schemaType.options).toEqual({
    shopifyDomain: 'example.myshopify.com',
  })
})
