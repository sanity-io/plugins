import {describe, expect, it} from 'vitest'

import {constructReplacementQuery, REPLACEMENT_PAGE_SIZE} from './constructReplacementQuery'

const base = {
  assetToReplaceId: 'image-original',
  excludeTagSlugs: [],
  filters: {folderId: null, searchQuery: '', tagId: null},
  pageIndex: 0,
  showMediaLibraryAssets: true,
}

describe('constructReplacementQuery', () => {
  it('lists published images except the asset being replaced', () => {
    const {params, query} = constructReplacementQuery(base)

    expect(query).toContain('_type == "sanity.imageAsset"')
    expect(query).not.toContain('sanity.fileAsset')
    expect(query).toContain('!(_id in path("drafts.**"))')
    expect(query).toContain('_id != $assetToReplaceId')
    expect(params).toEqual({assetToReplaceId: 'image-original', end: 100, start: 0})
  })

  it('omits search, tag and folder clauses when no filters are set', () => {
    const {query} = constructReplacementQuery(base)

    expect(query).not.toContain('match')
    expect(query).not.toContain('references(')
    expect(query).not.toContain('opt.media.folder')
  })

  it('passes the search text as a parameter instead of interpolating it', () => {
    const {params, query} = constructReplacementQuery({
      ...base,
      filters: {...base.filters, searchQuery: "  o'brien  "},
    })

    expect(query).toContain('match $searchPattern')
    expect(query).not.toContain('brien')
    expect(params.searchPattern).toBe("*o'brien*")
  })

  it('matches localized alt text, title, description and credit line when locales are configured', () => {
    const {query} = constructReplacementQuery({
      ...base,
      filters: {...base.filters, searchQuery: 'faucet'},
      localeIds: ['en', 'zh-CN'],
    })

    expect(query).toContain(
      '[_id, altText, altText["en"], altText["zh-CN"], assetId, creditLine, creditLine["en"], creditLine["zh-CN"], description, description["en"], description["zh-CN"], originalFilename, title, title["en"], title["zh-CN"], url] match $searchPattern',
    )
  })

  it('filters by tag and folder through parameters', () => {
    const {params, query} = constructReplacementQuery({
      ...base,
      filters: {folderId: 'folder-1', searchQuery: '', tagId: 'tag-1'},
    })

    expect(query).toContain('references($tagId)')
    expect(query).toContain('opt.media.folder._ref == $folderId')
    expect(params).toMatchObject({folderId: 'folder-1', tagId: 'tag-1'})
  })

  it('keeps the excludeTags and showMediaLibraryAssets plugin options', () => {
    const {query} = constructReplacementQuery({
      ...base,
      excludeTagSlugs: ['hidden'],
      showMediaLibraryAssets: false,
    })

    expect(query).toContain('["hidden"]')
    expect(query).toContain('sanity-media-library')
  })

  it('pages through results', () => {
    const {params, query} = constructReplacementQuery({...base, pageIndex: 2})

    expect(query).toContain('[$start...$end]')
    expect(params.start).toBe(2 * REPLACEMENT_PAGE_SIZE)
    expect(params.end).toBe(3 * REPLACEMENT_PAGE_SIZE)
  })
})
