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
  const span = (block.children ?? []).find(
    (child): child is PortableTextSpan =>
      child._type === 'span' && 'text' in child && child.text === text,
  )
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
})
