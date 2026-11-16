import {Schema} from '@sanity/schema'
import type {SanityDocument} from 'sanity'
import {expect, test} from 'vitest'

import {
  BaseDocumentDeserializer,
  BaseDocumentMerger,
  BaseDocumentSerializer,
  customSerializers,
} from '../../src'
import {getHTMLNode} from './utils'

function serialize(
  types: Record<string, any>[],
  doc: Record<string, any>,
  serializers = customSerializers,
) {
  const schema: InstanceType<typeof Schema> = new Schema({name: 'guards', types})
  return BaseDocumentSerializer(schema).serializeDocument(
    doc as unknown as SanityDocument,
    'document',
    'en',
    undefined,
    serializers,
  )
}

function htmlOf(
  types: Record<string, any>[],
  doc: Record<string, any>,
  serializers = customSerializers,
) {
  return getHTMLNode(serialize(types, doc, serializers)).body.innerHTML
}

const blockWithCustomField = {
  type: 'block',
  fields: [{name: 'textAlign', type: 'string', localize: false}],
}

test('portable text blocks with custom fields keep their text', () => {
  const doc = {
    _id: 'a',
    _type: 'article',
    _rev: '1',
    content: [
      {
        _key: 'b1',
        _type: 'block',
        style: 'normal',
        textAlign: 'center',
        markDefs: [],
        children: [{_key: 's1', _type: 'span', text: 'Translate this sentence', marks: []}],
      },
    ],
  }
  const inlineArticle = {
    name: 'article',
    type: 'document',
    fields: [{name: 'content', type: 'array', of: [blockWithCustomField]}],
  }
  const body = {name: 'body', type: 'array', of: [blockWithCustomField]}
  const namedArticle = {
    name: 'article',
    type: 'document',
    fields: [{name: 'content', type: 'body'}],
  }

  expect(htmlOf([inlineArticle], doc)).toContain('<p id="b1">Translate this sentence</p>')
  expect(htmlOf([body, namedArticle], doc)).toContain('<p id="b1">Translate this sentence</p>')
})

test('named array types with the same inline member name keep their own fields', () => {
  const heroSlides = {
    name: 'heroSlides',
    type: 'array',
    of: [
      {
        name: 'slide',
        type: 'object',
        fields: [
          {name: 'title', type: 'string'},
          {name: 'videoUrl', type: 'string', localize: false},
        ],
      },
    ],
  }
  const quoteSlides = {
    name: 'quoteSlides',
    type: 'array',
    of: [
      {
        name: 'slide',
        type: 'object',
        fields: [
          {name: 'quote', type: 'string'},
          {name: 'author', type: 'string'},
        ],
      },
    ],
  }
  const page = {
    name: 'page',
    type: 'document',
    fields: [
      {name: 'heroes', type: 'heroSlides'},
      {name: 'quotes', type: 'quoteSlides'},
    ],
  }
  const html = htmlOf([heroSlides, quoteSlides, page], {
    _id: 'p',
    _type: 'page',
    _rev: '1',
    heroes: [
      {_key: 'h1', _type: 'slide', title: 'Hero title', videoUrl: 'https://cdn.example/a.mp4'},
    ],
    quotes: [{_key: 'q1', _type: 'slide', quote: 'A quoted line', author: 'Ada'}],
  })

  expect(html).toContain('<span class="title">Hero title</span>')
  expect(html).toContain('<span class="quote">A quoted line</span>')
  expect(html).toContain('<span class="author">Ada</span>')
  expect(html).not.toContain('a.mp4')
  expect(html).not.toContain('videoUrl')
})

test('keys absent from a named object stay out of the translation and survive import', () => {
  const card = {
    name: 'card',
    type: 'object',
    fields: [{name: 'title', type: 'string'}],
  }
  const page = {
    name: 'page',
    type: 'document',
    fields: [{name: 'hero', type: 'card'}],
  }
  const original = {
    _id: 'p',
    _type: 'page',
    _rev: '1',
    hero: {
      _type: 'card',
      title: 'Visible',
      retiredBody: [
        {
          _key: 'b1',
          _type: 'block',
          style: 'normal',
          markDefs: [
            {
              _key: 'link1',
              _type: 'link',
              href: 'https://example.com/private',
              internalCampaign: 'secret-campaign',
            },
          ],
          children: [{_key: 's1', _type: 'span', text: 'Secret leftover copy', marks: ['link1']}],
        },
      ],
    },
  }
  const serialized = serialize([card, page], original)
  const html = getHTMLNode(serialized).body.innerHTML
  const merged = BaseDocumentMerger.documentLevelMerge(
    BaseDocumentDeserializer.deserializeDocument(serialized.content),
    original as unknown as SanityDocument,
  )

  expect(html).toContain('<span class="title">Visible</span>')
  expect(html).not.toContain('Secret leftover copy')
  expect(html).not.toContain('secret-campaign')
  expect(merged.hero.retiredBody).toEqual(original.hero.retiredBody)
})

test('anonymous objects still round-trip keys the schema does not declare', () => {
  const page = {
    name: 'page',
    type: 'document',
    fields: [
      {
        name: 'settings',
        type: 'object',
        fields: [
          {name: 'title', type: 'string'},
          {name: 'theme', type: 'string', localize: false},
        ],
      },
    ],
  }
  const original = {
    _id: 'p',
    _type: 'page',
    _rev: '1',
    settings: {_type: 'object', title: 'Hello', theme: 'dark', extraNote: 'keep me'},
  }
  const serialized = serialize([page], original)
  const html = getHTMLNode(serialized).body.innerHTML
  const merged = BaseDocumentMerger.documentLevelMerge(
    BaseDocumentDeserializer.deserializeDocument(serialized.content),
    original as unknown as SanityDocument,
  )

  expect(html).toContain('<span class="title">Hello</span>')
  expect(html).toContain('<span class="extraNote">keep me</span>')
  expect(html).not.toContain('dark')
  expect(merged.settings.theme).toBe('dark')
  expect(merged.settings.extraNote).toBe('keep me')
})

test('unnamed array objects without _type honor localize: false', () => {
  const page = {
    name: 'page',
    type: 'document',
    fields: [
      {
        name: 'rows',
        type: 'array',
        of: [
          {
            type: 'object',
            fields: [
              {name: 'label', type: 'string'},
              {name: 'token', type: 'string', localize: false},
            ],
          },
        ],
      },
    ],
  }
  const html = htmlOf([page], {
    _id: 'p',
    _type: 'page',
    _rev: '1',
    rows: [{_key: 'r1', label: 'Show me', token: 'secret-token', note: 'legacy'}],
  })

  expect(html).toContain('<span class="label">Show me</span>')
  expect(html).toContain('<span class="note">legacy</span>')
  expect(html).not.toContain('secret-token')
})

test('nested custom serializers do not receive localize: false fields', () => {
  const card = {
    name: 'card',
    type: 'object',
    fields: [
      {name: 'title', type: 'string'},
      {name: 'token', type: 'string', localize: false},
    ],
  }
  const wrap = {
    name: 'wrap',
    type: 'object',
    fields: [{name: 'card', type: 'card'}],
  }
  const page = {
    name: 'page',
    type: 'document',
    fields: [{name: 'wrap', type: 'wrap'}],
  }
  const serializers = {
    ...customSerializers,
    types: {
      ...customSerializers.types,
      card: ({value}: {value: {title?: string; token?: string}}) =>
        `<div class="card">${value.title ?? ''}|${value.token ?? ''}</div>`,
    },
  }
  const html = htmlOf(
    [card, wrap, page],
    {
      _id: 'p',
      _type: 'page',
      _rev: '1',
      wrap: {_type: 'wrap', card: {_type: 'card', title: 'Hello', token: 'secret-token'}},
    },
    serializers,
  )

  expect(html).toContain('Hello')
  expect(html).not.toContain('secret-token')
})
