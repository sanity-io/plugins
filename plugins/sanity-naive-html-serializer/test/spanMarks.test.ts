import type {PortableTextBlock, PortableTextSpan, SanityDocument} from 'sanity'
import {expect, test, vi} from 'vitest'

import {BaseDocumentDeserializer, BaseDocumentSerializer} from '../src'
import schema from './__fixtures__/schema'

const internalLinkKey = 'a1b2c3d4e5f6'
const externalLinkKey = 'b7c8d9e0f1a2'
const annotationKey = 'c3d4e5f6a7b8'

const documentWithMarks = {
  _id: 'doc-marks',
  _rev: '1',
  _type: 'documentLevelArticle',
  title: 'Marks',
  content: [
    {
      _key: '94e9e54cb1ad',
      _type: 'block',
      style: 'normal',
      markDefs: [
        {
          _key: internalLinkKey,
          _type: 'link',
          reference: {_type: 'reference', _ref: 'post-123'},
        },
      ],
      children: [
        {
          _key: 'span-before',
          _type: 'span',
          marks: [],
          text: 'This is a link to another post: ',
        },
        {
          _key: 'span-link',
          _type: 'span',
          marks: [internalLinkKey],
          text: 'Link',
        },
      ],
    },
    {
      _key: 'external-block',
      _type: 'block',
      style: 'normal',
      markDefs: [
        {
          _key: externalLinkKey,
          _type: 'link',
          href: 'https://example.com/posts/hello?a=1&b=2',
          blank: true,
        },
      ],
      children: [
        {
          _key: 'span-ext',
          _type: 'span',
          marks: ['strong', externalLinkKey],
          text: 'External',
        },
      ],
    },
    {
      _key: 'annotation-block',
      _type: 'block',
      style: 'normal',
      markDefs: [
        {
          _key: annotationKey,
          _type: 'annotation',
          title: 'Annotation payload title',
        },
      ],
      children: [
        {
          _key: 'span-ann',
          _type: 'span',
          marks: [annotationKey],
          text: 'annotated',
        },
      ],
    },
    {
      _key: 'decorator-block',
      _type: 'block',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _key: 'span-strong',
          _type: 'span',
          marks: ['strong', 'em'],
          text: 'Styled',
        },
      ],
    },
  ],
} as unknown as SanityDocument

function blockByKey(blocks: PortableTextBlock[], key: string): PortableTextBlock {
  const block = blocks.find((candidate) => candidate._key === key)
  if (!block) {
    throw new Error(`Missing block ${key}`)
  }
  return block
}

function spanByText(block: PortableTextBlock, text: string): PortableTextSpan {
  const children: unknown[] = Array.isArray(block.children) ? block.children : []
  const span = children.find((child): child is PortableTextSpan => {
    return (
      typeof child === 'object' &&
      child !== null &&
      '_type' in child &&
      child._type === 'span' &&
      'text' in child &&
      child.text === text
    )
  })
  if (!span) {
    throw new Error(`Missing span "${text}"`)
  }
  return span
}

test('span marks round-trip through HTML, including links without an href', () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})

  const serialized = BaseDocumentSerializer(schema).serializeDocument(documentWithMarks, 'document')
  const deserialized = BaseDocumentDeserializer.deserializeDocument(serialized.content)
  const blocks = deserialized.content as PortableTextBlock[]

  // The reported HTML keeps the anchor, but the mark payload has to travel with it.
  expect(serialized.content).toContain('>Link</a>')
  expect(serialized.content).toContain('post-123')

  const internalLink = blockByKey(blocks, '94e9e54cb1ad')
  expect(internalLink.markDefs).toEqual([
    {
      _key: internalLinkKey,
      _type: 'link',
      reference: {_type: 'reference', _ref: 'post-123'},
    },
  ])
  expect(spanByText(internalLink, 'This is a link to another post: ').marks).toEqual([])
  expect(spanByText(internalLink, 'Link').marks).toEqual([internalLinkKey])

  const externalLink = blockByKey(blocks, 'external-block')
  expect(externalLink.markDefs).toEqual([
    {
      _key: externalLinkKey,
      _type: 'link',
      href: 'https://example.com/posts/hello?a=1&b=2',
      blank: true,
    },
  ])
  expect(spanByText(externalLink, 'External').marks).toEqual(
    expect.arrayContaining(['strong', externalLinkKey]),
  )
  expect(spanByText(externalLink, 'External').marks).toHaveLength(2)

  const annotation = blockByKey(blocks, 'annotation-block')
  expect(annotation.markDefs).toEqual([
    {
      _key: annotationKey,
      _type: 'annotation',
      title: 'Annotation payload title',
    },
  ])
  expect(spanByText(annotation, 'annotated').marks).toEqual([annotationKey])

  const decorators = blockByKey(blocks, 'decorator-block')
  expect(decorators.markDefs).toEqual([])
  expect(spanByText(decorators, 'Styled').marks).toEqual(expect.arrayContaining(['strong', 'em']))
  expect(spanByText(decorators, 'Styled').marks).toHaveLength(2)
  expect(serialized.content).not.toContain(`id="${internalLinkKey}"`)
  expect(serialized.content).not.toContain(`id="${externalLinkKey}"`)
  expect(serialized.content).not.toContain(`id="${annotationKey}"`)
})

function documentWithContent(content: PortableTextBlock[]): SanityDocument {
  return {
    _id: 'doc-marks',
    _rev: '1',
    _type: 'documentLevelArticle',
    title: 'Marks',
    content,
  } as unknown as SanityDocument
}

function roundTripContent(content: PortableTextBlock[]): {
  html: string
  blocks: PortableTextBlock[]
} {
  const serialized = BaseDocumentSerializer(schema).serializeDocument(
    documentWithContent(content),
    'document',
  )
  const deserialized = BaseDocumentDeserializer.deserializeDocument(serialized.content)
  return {html: serialized.content, blocks: deserialized.content as PortableTextBlock[]}
}

test('an edited anchor href replaces the payload url and keeps the other link fields', () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})

  const linkKey = 'link-with-href'
  const {html} = roundTripContent([
    {
      _key: 'href-block',
      _type: 'block',
      style: 'normal',
      markDefs: [
        {
          _key: linkKey,
          _type: 'link',
          href: 'https://example.com/old?a=1&b=2',
          blank: true,
          reference: {_type: 'reference', _ref: 'post-1'},
        },
      ],
      children: [{_key: 'span-href', _type: 'span', marks: [linkKey], text: 'Go'}],
    },
  ])

  const edited = html.replace(
    'href="https://example.com/old?a=1&amp;b=2"',
    'href="https://translated.example/nueva"',
  )
  expect(edited).not.toBe(html)

  const deserialized = BaseDocumentDeserializer.deserializeDocument(edited)
  const block = blockByKey(deserialized.content as PortableTextBlock[], 'href-block')
  expect(block.markDefs).toEqual([
    {
      _key: linkKey,
      _type: 'link',
      href: 'https://translated.example/nueva',
      blank: true,
      reference: {_type: 'reference', _ref: 'post-1'},
    },
  ])
  expect(spanByText(block, 'Go').marks).toEqual([linkKey])
})

test('a safe anchor href wins over a different url hidden in the mark payload', () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})

  const linkKey = 'safe-link'
  const safeHref = 'https://safe.example/public'
  const {html} = roundTripContent([
    {
      _key: 'safe-block',
      _type: 'block',
      style: 'normal',
      markDefs: [{_key: linkKey, _type: 'link', href: safeHref, blank: true}],
      children: [{_key: 'span-safe', _type: 'span', marks: [linkKey], text: 'Read'}],
    },
  ])

  const tampered = html.replaceAll(
    encodeURIComponent(safeHref),
    encodeURIComponent('javascript:alert(document.domain)'),
  )
  expect(tampered).toContain(`href="${safeHref}"`)
  expect(tampered).not.toContain(encodeURIComponent(safeHref))

  const deserialized = BaseDocumentDeserializer.deserializeDocument(tampered)
  const block = blockByKey(deserialized.content as PortableTextBlock[], 'safe-block')
  expect(block.markDefs).toEqual([{_key: linkKey, _type: 'link', href: safeHref, blank: true}])
})

test('an unsafe url that exists only in the mark payload is dropped', () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})

  const linkKey = 'js-link'
  const {html, blocks} = roundTripContent([
    {
      _key: 'js-block',
      _type: 'block',
      style: 'normal',
      markDefs: [{_key: linkKey, _type: 'link', href: 'javascript:alert(1)'}],
      children: [{_key: 'span-js', _type: 'span', marks: [linkKey], text: 'Click'}],
    },
  ])

  expect(html).toContain('href=""')
  expect(html).toContain(encodeURIComponent('javascript:alert(1)'))
  const block = blockByKey(blocks, 'js-block')
  expect(block.markDefs).toEqual([{_key: linkKey, _type: 'link'}])
  expect(spanByText(block, 'Click').marks).toEqual([linkKey])

  const visible = html.replace('href=""', 'href="javascript:alert(1)"')
  const deserialized = BaseDocumentDeserializer.deserializeDocument(visible)
  expect(blockByKey(deserialized.content as PortableTextBlock[], 'js-block').markDefs).toEqual([
    {_key: linkKey, _type: 'link', href: 'javascript:alert(1)'},
  ])
})

test('the same mark on separate phrases is one definition and does not repeat an id', () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})

  const linkKey = 'shared-link'
  const {html, blocks} = roundTripContent([
    {
      _key: 'shared-block',
      _type: 'block',
      style: 'normal',
      markDefs: [{_key: linkKey, _type: 'link', href: 'https://example.com/a', blank: true}],
      children: [
        {_key: 'span-first', _type: 'span', marks: [linkKey], text: 'First'},
        {_key: 'span-middle', _type: 'span', marks: [], text: ' middle '},
        {_key: 'span-second', _type: 'span', marks: [linkKey], text: 'Second'},
      ],
    },
  ])

  expect(html.match(/<a\b/g)).toHaveLength(2)
  expect(html).not.toContain(`id="${linkKey}"`)
  const block = blockByKey(blocks, 'shared-block')
  expect(block.markDefs).toEqual([
    {_key: linkKey, _type: 'link', href: 'https://example.com/a', blank: true},
  ])
  expect(spanByText(block, 'First').marks).toEqual([linkKey])
  expect(spanByText(block, ' middle ').marks).toEqual([])
  expect(spanByText(block, 'Second').marks).toEqual([linkKey])
})
