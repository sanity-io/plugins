/* oxlint-disable typescript-eslint/no-unsafe-type-assertion */
import {fileURLToPath} from 'node:url'

import type {DocumentActionComponent, ObjectMember} from 'sanity'
import {describe, expect, test, vi} from 'vitest'
import {getPackageExportsManifest} from 'vitest-package-exports'

import {sfccPlugin, sfccRenderMembers} from './index'

test('package exports', {timeout: 30_000}, async () => {
  const manifest = await getPackageExportsManifest({
    importMode: 'dist',
    cwd: fileURLToPath(import.meta.url),
  })

  expect(manifest.exports).toMatchInlineSnapshot(`
    {
      ".": {
        "SfccDocumentStatus": "function",
        "SfccOfflineBanner": "function",
        "categoryStructure": "function",
        "productStructure": "function",
        "sfccCategoryPreview": "object",
        "sfccCategoryStoreField": "object",
        "sfccPlugin": "function",
        "sfccProductPreview": "object",
        "sfccProductStoreField": "object",
        "sfccRenderMembers": "function",
      },
    }
  `)
})

describe('sfccRenderMembers', () => {
  test('prepends an offline banner decoration', () => {
    const members = [{kind: 'field', key: 'title', name: 'title', index: 0}] as ObjectMember[]

    const result = sfccRenderMembers(members)

    expect(result[0]).toMatchObject({
      key: 'sfcc-offline-banner',
      kind: 'decoration',
    })
  })

  test('preserves all original members after the decoration', () => {
    const members = [
      {kind: 'field', key: 'title', name: 'title', index: 0},
      {kind: 'field', key: 'body', name: 'body', index: 1},
    ] as ObjectMember[]

    const result = sfccRenderMembers(members)

    expect(result).toHaveLength(3)
    expect(result.slice(1)).toEqual(members)
  })
})

describe('sfccPlugin', () => {
  function createMockAction(action: DocumentActionComponent['action']): DocumentActionComponent {
    const component: DocumentActionComponent = vi.fn(() => null)
    component.action = action
    return component
  }

  const mockActions = [
    createMockAction('publish'),
    createMockAction('delete'),
    createMockAction('duplicate'),
    createMockAction('unpublish'),
  ]

  describe('document.actions', () => {
    const pluginConfig = sfccPlugin()
    const actionsResolver = pluginConfig.document!.actions as (
      prev: DocumentActionComponent[],
      context: {schemaType: string},
    ) => DocumentActionComponent[]

    test('filters out duplicate and wraps delete for product type', () => {
      const result = actionsResolver(mockActions, {schemaType: 'product'})

      expect(result).toHaveLength(3)
      const actionNames = result.map((a: DocumentActionComponent) => a.action)
      expect(actionNames).not.toContain('duplicate')
      expect(actionNames).toContain('publish')
      expect(actionNames).toContain('unpublish')
    })

    test('replaces the delete action for category type', () => {
      const originalDelete = mockActions.find((a) => a.action === 'delete')
      const result = actionsResolver(mockActions, {schemaType: 'category'})

      const wrappedDelete = result.find(
        (a: DocumentActionComponent) =>
          a !== originalDelete && a.action !== 'publish' && a.action !== 'unpublish',
      )
      expect(wrappedDelete).toBeDefined()
      expect(wrappedDelete).not.toBe(originalDelete)
    })

    test('passes through unchanged for non-SFCC types', () => {
      const result = actionsResolver(mockActions, {schemaType: 'post'})

      expect(result).toBe(mockActions)
    })
  })

  describe('document.newDocumentOptions', () => {
    const pluginConfig = sfccPlugin()
    const optionsResolver = pluginConfig.document!.newDocumentOptions as (
      prev: {templateId: string; title: string}[],
      context: unknown,
    ) => {templateId: string; title: string}[]

    const mockTemplates = [
      {templateId: 'product', title: 'Product'},
      {templateId: 'category', title: 'Category'},
      {templateId: 'post', title: 'Post'},
      {templateId: 'page', title: 'Page'},
    ]

    test('removes product and category templates', () => {
      const result = optionsResolver(mockTemplates, {})

      const ids = result.map((t) => t.templateId)
      expect(ids).not.toContain('product')
      expect(ids).not.toContain('category')
    })

    test('keeps other templates intact', () => {
      const result = optionsResolver(mockTemplates, {})

      const ids = result.map((t) => t.templateId)
      expect(ids).toContain('post')
      expect(ids).toContain('page')
      expect(result).toHaveLength(2)
    })
  })
})
