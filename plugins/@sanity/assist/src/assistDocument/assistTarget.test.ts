import type {SystemVariant, TargetDocumentState, VersionInfoDocumentStub} from 'sanity'
import {describe, expect, test} from 'vitest'

import {resolveAssistTarget, type ResolveAssistTargetOptions} from './assistTarget'

const variant: SystemVariant = {
  _id: '_.variants.premium',
  _type: 'system.variant',
  _rev: 'rev',
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  name: 'premium',
  conditions: {},
  priority: 1,
}

function stub(id: string, scopeId?: string): VersionInfoDocumentStub {
  return {
    _id: id,
    _type: 'article',
    _rev: 'rev',
    _createdAt: '2026-01-01T00:00:00Z',
    _updatedAt: '2026-01-01T00:00:00Z',
    _system: {group: {_ref: 'foo', _weak: true}, scopeId},
  }
}

const siblings = {published: undefined, draft: undefined, version: undefined}

function resolve(overrides: Partial<ResolveAssistTargetOptions>) {
  return resolveAssistTarget({
    documentId: 'foo',
    liveEdit: false,
    selectedReleaseId: undefined,
    selectedVariantName: undefined,
    targetDocumentState: undefined,
    ...overrides,
  })
}

describe('resolveAssistTarget', () => {
  describe('without variant support (Studio versions predating targetDocumentState)', () => {
    test('targets the draft', () => {
      expect(resolve({})).toEqual({kind: 'base', documentId: 'drafts.foo'})
    })

    test('targets the published document for live edit types', () => {
      expect(resolve({liveEdit: true})).toEqual({kind: 'base', documentId: 'foo'})
    })

    test('targets the release version when a release is selected', () => {
      expect(resolve({selectedReleaseId: 'rSummer'})).toEqual({
        kind: 'base',
        documentId: 'versions.rSummer.foo',
      })
    })
  })

  describe('without a selected variant', () => {
    test('keeps targeting the draft when the target is ready', () => {
      const targetDocumentState: TargetDocumentState = {
        status: 'ready',
        targetDocument: stub('drafts.foo'),
        scopeId: undefined,
        variant: undefined,
        siblings,
      }
      expect(resolve({targetDocumentState})).toEqual({kind: 'base', documentId: 'drafts.foo'})
    })

    test('keeps targeting the release version when a release is selected', () => {
      const targetDocumentState: TargetDocumentState = {
        status: 'ready',
        targetDocument: stub('versions.rSummer.foo', 'rSummer'),
        scopeId: 'rSummer',
        variant: undefined,
        siblings,
      }
      expect(resolve({targetDocumentState, selectedReleaseId: 'rSummer'})).toEqual({
        kind: 'base',
        documentId: 'versions.rSummer.foo',
      })
    })

    test('targets the release version even before it exists in the release', () => {
      const targetDocumentState: TargetDocumentState = {
        status: 'ready',
        targetDocument: undefined,
        scopeId: undefined,
        variant: undefined,
        siblings,
      }
      expect(resolve({targetDocumentState, selectedReleaseId: 'rSummer'})).toEqual({
        kind: 'base',
        documentId: 'versions.rSummer.foo',
      })
    })

    test('does not wait for resolution, since it can only land on the base pair', () => {
      expect(resolve({targetDocumentState: {status: 'resolving'}})).toEqual({
        kind: 'base',
        documentId: 'drafts.foo',
      })
    })
  })

  describe('with a selected variant', () => {
    test('targets the existing variant document', () => {
      const targetDocumentState: TargetDocumentState = {
        status: 'ready',
        targetDocument: stub('versions.a1b2c3.foo', 'a1b2c3'),
        scopeId: 'a1b2c3',
        variant,
        siblings,
      }
      expect(resolve({targetDocumentState, selectedVariantName: 'premium'})).toEqual({
        kind: 'variant',
        documentId: 'versions.a1b2c3.foo',
      })
    })

    test('targets the existing variant document over the selected release version', () => {
      const targetDocumentState: TargetDocumentState = {
        status: 'ready',
        targetDocument: stub('versions.d4e5f6.foo', 'd4e5f6'),
        scopeId: 'd4e5f6',
        variant,
        siblings,
      }
      expect(
        resolve({
          targetDocumentState,
          selectedVariantName: 'premium',
          selectedReleaseId: 'rSummer',
        }),
      ).toEqual({kind: 'variant', documentId: 'versions.d4e5f6.foo'})
    })

    test('targets the advertised draft id when the draft variant can be created by editing', () => {
      const targetDocumentState: TargetDocumentState = {
        status: 'variant-missing',
        variant,
        bundle: 'drafts',
        siblings: {...siblings, published: stub('versions.p7q8r9.foo', 'p7q8r9')},
        creatableTarget: {id: 'versions.a1b2c3.foo', scopeId: 'a1b2c3'},
      }
      expect(resolve({targetDocumentState, selectedVariantName: 'premium'})).toEqual({
        kind: 'variant',
        documentId: 'versions.a1b2c3.foo',
      })
    })

    test('is unavailable when the document is not in the variant and cannot be created', () => {
      const targetDocumentState: TargetDocumentState = {
        status: 'variant-missing',
        variant,
        bundle: 'drafts',
        siblings,
      }
      expect(resolve({targetDocumentState, selectedVariantName: 'premium'})).toEqual({
        kind: 'unavailable',
      })
    })

    test('is unavailable when the variant is ready without a target document', () => {
      const targetDocumentState: TargetDocumentState = {
        status: 'ready',
        targetDocument: undefined,
        scopeId: undefined,
        variant,
        siblings,
      }
      expect(resolve({targetDocumentState, selectedVariantName: 'premium'})).toEqual({
        kind: 'unavailable',
      })
    })

    test('is unavailable when the variant definition does not exist', () => {
      const targetDocumentState: TargetDocumentState = {
        status: 'variant-definition-document-not-found',
        requestedVariantName: 'premium',
      }
      expect(resolve({targetDocumentState, selectedVariantName: 'premium'})).toEqual({
        kind: 'unavailable',
      })
    })

    test('is unavailable while the target is resolving', () => {
      expect(
        resolve({targetDocumentState: {status: 'resolving'}, selectedVariantName: 'premium'}),
      ).toEqual({kind: 'unavailable'})
    })
  })
})
