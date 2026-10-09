import {Schema} from '@sanity/schema'
import type {SanityDocument} from 'sanity'
import {expect, test} from 'vitest'

import {BaseDocumentDeserializer, BaseDocumentMerger, BaseDocumentSerializer} from '../../src'
import {getHTMLNode} from './utils'

const background = {
  name: 'background',
  title: 'Background',
  type: 'document',
  fields: [{name: 'title', type: 'string', title: 'Title'}],
}

const simpleBlock = {
  name: 'simpleBlock',
  title: 'Simple Block',
  type: 'array',
  of: [{type: 'block'}],
}

const typographyBlock = {
  name: 'typographyBlock',
  title: 'Typography Block',
  type: 'array',
  of: [{type: 'block'}],
}

// Schema from https://github.com/sanity-io/plugins/issues/951
const moduleVideoCarousel = {
  name: 'moduleVideoCarousel',
  title: 'Video Carousel',
  type: 'object',
  fields: [
    {name: 'heading', title: 'Heading', type: 'string'},
    {name: 'description', title: 'Description', type: 'simpleBlock'},
    {
      name: 'slides',
      title: 'Slides',
      type: 'array',
      of: [
        {
          name: 'slide',
          title: 'Slide',
          type: 'object',
          fields: [
            {name: 'title', title: 'Title', type: 'string'},
            {name: 'description', title: 'Description', type: 'typographyBlock'},
            {
              localize: false,
              name: 'videoUrl',
              title: 'Video URL',
              type: 'string',
            },
          ],
        },
      ],
    },
    {
      description: 'Choose your background',
      localize: false,
      name: 'background',
      title: 'Background',
      type: 'reference',
      to: [{type: 'background'}],
    },
    {
      initialValue: 'spacious',
      localize: false,
      name: 'margin',
      options: {
        list: [
          {title: 'Spacious', value: 'spacious'},
          {title: 'Moderate', value: 'moderate'},
          {title: 'Tight', value: 'tight'},
        ],
      },
      title: 'Margin',
      type: 'string',
    },
  ],
}

const registeredTypes = [background, simpleBlock, typographyBlock, moduleVideoCarousel]

const page = {
  name: 'page',
  title: 'Page',
  type: 'document',
  fields: [
    {name: 'title', title: 'Title', type: 'string'},
    {
      name: 'modules',
      title: 'Modules',
      type: 'array',
      of: [{type: 'moduleVideoCarousel'}],
    },
    {name: 'hero', title: 'Hero', type: 'moduleVideoCarousel'},
  ],
}

const inlinePage = {
  name: 'inlinePage',
  title: 'Inline Page',
  type: 'document',
  fields: [
    {name: 'title', title: 'Title', type: 'string'},
    {
      name: 'modules',
      title: 'Modules',
      type: 'array',
      of: [moduleVideoCarousel],
    },
  ],
}

const anonymousSettingsPage = {
  name: 'anonymousSettingsPage',
  title: 'Anonymous Settings Page',
  type: 'document',
  fields: [
    {
      name: 'settings',
      title: 'Settings',
      type: 'object',
      fields: [
        {name: 'title', title: 'Title', type: 'string'},
        {name: 'theme', title: 'Theme', type: 'string', localize: false},
      ],
    },
  ],
}

const moduleValue = {
  _key: 'module1',
  _type: 'moduleVideoCarousel',
  heading: 'Real videos by real people',
  margin: 'spacious',
  background: {_type: 'reference', _ref: 'bg1'},
  slides: [
    {
      _key: 'slide1',
      _type: 'slide',
      title: 'Clip',
      videoUrl: 'https://example.com/video.mp4',
    },
  ],
}

function serialize(types: Record<string, any>[], doc: Record<string, any>) {
  const schema: InstanceType<typeof Schema> = new Schema({name: 'repro', types})
  return BaseDocumentSerializer(schema).serializeDocument(
    doc as unknown as SanityDocument,
    'document',
  )
}

function htmlOf(types: Record<string, any>[], doc: Record<string, any>) {
  return getHTMLNode(serialize(types, doc)).body.innerHTML
}

test('document fields marked localize: false are not serialized', () => {
  const html = htmlOf(
    [background, simpleBlock, typographyBlock, {...moduleVideoCarousel, type: 'document'}],
    {
      _id: 'doc1',
      _type: 'moduleVideoCarousel',
      _rev: 'rev',
      heading: 'Real videos by real people',
      margin: 'spacious',
    },
  )

  expect(html).toContain('<span class="heading">Real videos by real people</span>')
  expect(html).not.toContain('spacious')
  expect(html).not.toContain('margin')
})

test('localize: false on a page-builder module and its inline objects is not serialized', () => {
  const html = htmlOf([...registeredTypes, page], {
    _id: 'page1',
    _type: 'page',
    _rev: 'rev',
    title: 'Home',
    modules: [moduleValue],
  })

  expect(html).toContain('<span class="heading">Real videos by real people</span>')
  expect(html).toContain('<span class="title">Clip</span>')
  expect(html).not.toContain('<span class="margin">spacious</span>')
  expect(html).not.toContain('video.mp4')
  expect(html).not.toContain('videoUrl')
  expect(html).not.toContain('bg1')
})

test('localize: false on a nested object field is not serialized', () => {
  const html = htmlOf([...registeredTypes, page], {
    _id: 'page1',
    _type: 'page',
    _rev: 'rev',
    title: 'Home',
    hero: moduleValue,
  })

  // Reported Smartling payload mixed the translatable heading with margin.
  expect(html).toContain('<span class="heading">Real videos by real people</span>')
  expect(html).not.toContain('<span class="margin">spacious</span>')
  expect(html).not.toContain('video.mp4')
  expect(html).not.toContain('bg1')
})

test('localize: false on an inline object type that is not registered globally is not serialized', () => {
  const html = htmlOf([background, simpleBlock, typographyBlock, inlinePage], {
    _id: 'page2',
    _type: 'inlinePage',
    _rev: 'rev',
    title: 'Home',
    modules: [moduleValue],
  })

  expect(html).toContain('<span class="heading">Real videos by real people</span>')
  expect(html).not.toContain('<span class="margin">spacious</span>')
  expect(html).not.toContain('video.mp4')
})

test('localize: false on an anonymous inline object is not serialized', () => {
  const html = htmlOf([anonymousSettingsPage], {
    _id: 'page3',
    _type: 'anonymousSettingsPage',
    _rev: 'rev',
    settings: {_type: 'object', title: 'Hello', theme: 'dark'},
  })

  expect(html).toContain('<span class="title">Hello</span>')
  expect(html).not.toContain('dark')
  expect(html).not.toContain('theme')
})

test('fields skipped by localize: false are preserved when translations are merged', () => {
  const original = {
    _id: 'page1',
    _type: 'page',
    _rev: 'rev',
    title: 'Home',
    modules: [moduleValue],
    hero: moduleValue,
  }
  const serialized = serialize([...registeredTypes, page], original)
  const deserialized = BaseDocumentDeserializer.deserializeDocument(serialized.content)
  const merged = BaseDocumentMerger.documentLevelMerge(
    deserialized,
    original as unknown as SanityDocument,
  )

  expect(deserialized.hero.margin).toBeUndefined()
  expect(deserialized.hero.background).toBeUndefined()
  expect(deserialized.modules[0].slides[0].videoUrl).toBeUndefined()
  expect(merged.hero.margin).toBe('spacious')
  expect(merged.hero.background).toEqual({_type: 'reference', _ref: 'bg1'})
  expect(merged.modules[0].slides[0].videoUrl).toBe('https://example.com/video.mp4')
  expect(merged.hero.heading).toBe('Real videos by real people')
  expect(merged.modules[0].slides[0].title).toBe('Clip')
})
