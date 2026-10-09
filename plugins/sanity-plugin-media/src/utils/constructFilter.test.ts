// @vitest-environment node

import {describe, expect, it} from 'vitest'

import {inputs} from '../config/searchFacets'
import type {SearchFacetInputProps} from '../types'
import constructFilter from './constructFilter'

describe('constructFilter', () => {
  it('includes base filter that excludes drafts and restricts asset types', () => {
    const q = constructFilter({
      assetTypes: ['image', 'file'],
      searchFacets: [],
      searchQuery: undefined,
    })

    expect(q).toContain('_type in ["sanity.imageAsset","sanity.fileAsset"]')
    expect(q).toContain('!(_id in path("drafts.**"))')
  })

  it('limits to a single asset type in picker mode', () => {
    const q = constructFilter({
      assetTypes: ['image'],
      searchFacets: [],
      searchQuery: undefined,
    })

    expect(q).toContain('_type in ["sanity.imageAsset"]')
  })

  it('appends text search on trimmed query', () => {
    const q = constructFilter({
      assetTypes: ['file', 'image'],
      searchFacets: [],
      searchQuery: '  hello  ',
    })

    expect(q).toContain(
      "[_id, altText, assetId, creditLine, description, originalFilename, title, url] match '*hello*'",
    )
  })

  it('matches localized alt text, title, description, and credit line when locales are configured', () => {
    const q = constructFilter({
      assetTypes: ['file', 'image'],
      localeIds: ['en', 'zh-CN'],
      searchFacets: [],
      searchQuery: 'faucet',
    })

    // Bracket access: `altText.zh-CN` is subtraction, so `match` would miss the locale value.
    // The bare field stays so assets not yet migrated from a plain string still match.
    expect(q).toContain(
      '[_id, altText, altText["en"], altText["zh-CN"], assetId, creditLine, creditLine["en"], creditLine["zh-CN"], description, description["en"], description["zh-CN"], originalFilename, title, title["en"], title["zh-CN"], url] match \'*faucet*\'',
    )
  })

  it('matches an alt text facet against each configured locale', () => {
    const q = constructFilter({
      assetTypes: ['image', 'file'],
      localeIds: ['en', 'zh-CN'],
      searchFacets: [
        {...inputs.altText, operatorType: 'includes', value: 'faucet'} as SearchFacetInputProps,
      ],
      searchQuery: undefined,
    })

    expect(q).toContain('[altText, altText["en"], altText["zh-CN"]] match \'*faucet*\'')
  })

  it('excludes localized alt text for the does-not-include facet', () => {
    const q = constructFilter({
      assetTypes: ['image', 'file'],
      localeIds: ['en'],
      searchFacets: [
        {
          ...inputs.altText,
          operatorType: 'doesNotInclude',
          value: 'faucet',
        } as SearchFacetInputProps,
      ],
      searchQuery: undefined,
    })

    expect(q).toContain('!([altText, altText["en"]] match \'*faucet*\')')
  })

  it('treats a localized alt text field as empty only when no locale value is set', () => {
    const empty = constructFilter({
      assetTypes: ['image', 'file'],
      localeIds: ['en', 'zh-CN'],
      searchFacets: [{...inputs.altText, operatorType: 'empty'} as SearchFacetInputProps],
      searchQuery: undefined,
    })
    const notEmpty = constructFilter({
      assetTypes: ['image', 'file'],
      localeIds: ['en', 'zh-CN'],
      searchFacets: [{...inputs.altText, operatorType: 'notEmpty'} as SearchFacetInputProps],
      searchQuery: undefined,
    })

    const present =
      '((string(altText) == altText && defined(altText)) || defined(altText["en"]) || defined(altText["zh-CN"]))'
    expect(empty).toContain(`!(${present})`)
    expect(notEmpty).toContain(present)
  })

  it('does not localize facets that stay plain strings', () => {
    const q = constructFilter({
      assetTypes: ['image', 'file'],
      localeIds: ['en'],
      searchFacets: [
        {...inputs.fileName, operatorType: 'includes', value: 'photo'} as SearchFacetInputProps,
      ],
      searchQuery: undefined,
    })

    expect(q).toContain("originalFilename match '*photo*'")
    expect(q).not.toContain('originalFilename["en"]')
  })

  it('quotes locale ids so they cannot break out of the GROQ string', () => {
    const q = constructFilter({
      assetTypes: ['image'],
      localeIds: ['en"'],
      searchFacets: [
        {...inputs.title, operatorType: 'includes', value: 'Kitchen'} as SearchFacetInputProps,
      ],
      searchQuery: undefined,
    })

    expect(q).toContain('[title, title["en\\""]] match \'*Kitchen*\'')
  })

  it('ignores blank locale ids and does not repeat a locale', () => {
    const q = constructFilter({
      assetTypes: ['image'],
      localeIds: ['en', '', 'en'],
      searchFacets: [],
      searchQuery: 'faucet',
    })

    expect(q).toContain('altText, altText["en"], assetId')
    expect(q).not.toContain('altText[""]')
    expect(q.match(/altText\["en"\]/g)).toHaveLength(1)
  })

  it('composes number facet with field modifier (size / KB)', () => {
    const q = constructFilter({
      assetTypes: ['image'],
      searchFacets: [{...inputs.size, value: 500} as SearchFacetInputProps],
      searchQuery: undefined,
    })

    expect(q.replace(/\s+/g, ' ')).toContain('round(size / 1000) > 500')
  })

  it('composes searchable tag facet (references)', () => {
    const facet = {
      ...inputs.tag,
      operatorType: 'references' as const,
      value: {label: 'T', value: 'tag-id-1'},
    } as SearchFacetInputProps

    const q = constructFilter({
      assetTypes: ['image', 'file'],
      searchFacets: [facet],
      searchQuery: undefined,
    })

    expect(q).toContain("references('tag-id-1')")
  })

  it('composes select facet (inUse)', () => {
    const q = constructFilter({
      assetTypes: ['image', 'file'],
      searchFacets: [structuredClone(inputs.inUse)],
      searchQuery: undefined,
    })

    expect(q).toContain('count(*[references(^._id)]) > 0')
  })

  it('AND-joins base filter, search text, and multiple facets', () => {
    const q = constructFilter({
      assetTypes: ['image', 'file'],
      searchFacets: [{...inputs.title}, {...inputs.inUse}],
      searchQuery: 'x',
    })

    const parts = q.split(' && ')
    expect(parts.length).toBeGreaterThanOrEqual(4)
  })

  it('matches snapshot for stable GROQ shape (apiVersion / filter regressions)', () => {
    const q = constructFilter({
      assetTypes: ['file', 'image'],
      searchFacets: [
        {...inputs.size, value: 100} as SearchFacetInputProps,
        {
          ...inputs.tag,
          operatorType: 'references',
          value: {label: 'Example', value: 'abc123'},
        } as SearchFacetInputProps,
      ],
      searchQuery: 'portrait',
    })

    const normalized = q.replace(/\s+/g, ' ').trim()

    expect(normalized).toBe(
      '_type in ["sanity.fileAsset","sanity.imageAsset"] && !(_id in path("drafts.**")) && [_id, altText, assetId, creditLine, description, originalFilename, title, url] match \'*portrait*\' && round(size / 1000) > 100 && references(\'abc123\')',
    )
  })

  it('does not apply a folder filter in the all assets view', () => {
    const q = constructFilter({
      assetTypes: ['image', 'file'],
      searchFacets: [],
      searchQuery: undefined,
    })

    expect(q).not.toContain('opt.media.folder._ref')
  })

  it('filters to the current folder when a folder is selected', () => {
    const q = constructFilter({
      assetTypes: ['image', 'file'],
      currentFolderId: 'media.folder.products',
      searchFacets: [],
      searchQuery: undefined,
    })

    expect(q).toContain('opt.media.folder._ref == "media.folder.products"')
  })

  it('omits text search fragment when searchQuery is undefined', () => {
    const q = constructFilter({
      assetTypes: ['image', 'file'],
      searchFacets: [],
      searchQuery: undefined,
    })

    expect(q).not.toContain('match ')
  })

  it('excludes assets tagged with any slug listed in excludeTagSlugs', () => {
    const q = constructFilter({
      assetTypes: ['image', 'file'],
      excludeTagSlugs: ['internal', 'archived'],
      searchFacets: [],
      searchQuery: undefined,
    })

    const normalized = q.replace(/\s+/g, ' ')
    expect(normalized).toContain(
      '!(defined(opt.media.tags) && count(opt.media.tags[@._ref in *[_type == "media.tag" && name.current in ["internal","archived"]]._id]) > 0)',
    )
  })

  it('does not exclude Media Library assets by default', () => {
    const q = constructFilter({
      assetTypes: ['image', 'file'],
      searchFacets: [],
      searchQuery: undefined,
    })

    expect(q).not.toContain('source.name')
    expect(q).not.toContain('media._ref')
  })

  it('excludes Media Library assets when showMediaLibraryAssets is false', () => {
    const q = constructFilter({
      assetTypes: ['image', 'file'],
      searchFacets: [],
      searchQuery: undefined,
      showMediaLibraryAssets: false,
    })

    // The reliable signal is the `media` reference; `source.name` is an optional
    // confirmation. Both are checked, each guarded with `defined()` so plain
    // dataset-uploaded assets (which carry neither) are still returned.
    expect(q).toContain('!string::startsWith(media._ref, "media-library:")')
    expect(q).toContain('source.name != "sanity-media-library"')
    expect(q).toContain('!defined(media._ref)')
    expect(q).toContain('!defined(source.name)')
  })
})
