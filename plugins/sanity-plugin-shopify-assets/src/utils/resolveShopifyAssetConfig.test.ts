import {expect, test} from 'vitest'

import {resolveShopifyAssetConfig} from './resolveShopifyAssetConfig'

const pluginType = {
  options: {
    shopifyDomain: 'plugin.myshopify.com',
    dataset: 'production',
  },
  type: {name: 'object', type: null},
}

test('inherits plugin dataset and domain when the field sets neither', () => {
  expect(resolveShopifyAssetConfig({options: pluginType.options, type: pluginType})).toEqual({
    shopifyDomain: 'plugin.myshopify.com',
    dataset: 'production',
  })
})

test('keeps the plugin dataset when a field only overrides the domain', () => {
  expect(
    resolveShopifyAssetConfig({
      options: {shopifyDomain: 'field.myshopify.com'},
      type: pluginType,
    }),
  ).toEqual({
    shopifyDomain: 'field.myshopify.com',
    dataset: 'production',
  })
})

test('lets a field dataset override the plugin dataset', () => {
  expect(
    resolveShopifyAssetConfig({
      options: {dataset: 'staging'},
      type: pluginType,
    }),
  ).toEqual({
    shopifyDomain: 'plugin.myshopify.com',
    dataset: 'staging',
  })
})

test('lets a field override both settings', () => {
  expect(
    resolveShopifyAssetConfig({
      options: {shopifyDomain: 'both.myshopify.com', dataset: 'both'},
      type: pluginType,
    }),
  ).toEqual({
    shopifyDomain: 'both.myshopify.com',
    dataset: 'both',
  })
})

test('leaves dataset unset when neither the field nor the plugin provides one', () => {
  expect(
    resolveShopifyAssetConfig({
      options: {shopifyDomain: 'plugin.myshopify.com'},
      type: {options: {shopifyDomain: 'plugin.myshopify.com'}, type: null},
    }),
  ).toEqual({
    shopifyDomain: 'plugin.myshopify.com',
    dataset: undefined,
  })
})

test('ignores blank values and continues to the plugin default', () => {
  expect(
    resolveShopifyAssetConfig({
      options: {dataset: '   ', shopifyDomain: ''},
      type: pluginType,
    }),
  ).toEqual({
    shopifyDomain: 'plugin.myshopify.com',
    dataset: 'production',
  })
})

test('trims configured values', () => {
  expect(
    resolveShopifyAssetConfig({
      options: {dataset: ' staging ', shopifyDomain: ' store.myshopify.com '},
    }),
  ).toEqual({
    shopifyDomain: 'store.myshopify.com',
    dataset: 'staging',
  })
})
