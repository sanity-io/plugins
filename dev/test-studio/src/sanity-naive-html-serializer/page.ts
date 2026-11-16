import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {defineArrayMember, defineField, defineType, type FieldDefinition} from 'sanity'

// `localize` is read by sanity-naive-html-serializer from the raw schema. It is not a Studio field option.
function skipTranslation<T extends FieldDefinition>(field: T): T {
  return {...field, localize: false}
}

const heroSlide = defineArrayMember({
  name: 'slide',
  title: 'Hero slide',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string'}),
    skipTranslation(
      defineField({
        name: 'videoUrl',
        title: 'Video URL',
        type: 'string',
        description: 'Marked localize: false. The URL should not appear in HTML Preview.',
      }),
    ),
  ],
})

const quoteSlide = defineArrayMember({
  name: 'slide',
  title: 'Quote slide',
  type: 'object',
  fields: [
    defineField({name: 'quote', title: 'Quote', type: 'string'}),
    defineField({name: 'author', title: 'Author', type: 'string'}),
  ],
})

const carouselSlide = defineArrayMember({
  name: 'slide',
  title: 'Slide',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string'}),
    skipTranslation(
      defineField({
        name: 'videoUrl',
        title: 'Video URL',
        type: 'string',
        description: 'Marked localize: false. The URL should not appear in HTML Preview.',
      }),
    ),
  ],
})

export const naiveHtmlVideoCarousel = defineType({
  name: 'naiveHtmlVideoCarousel',
  title: 'Video carousel',
  type: 'object',
  fields: [
    defineField({name: 'heading', title: 'Heading', type: 'string'}),
    defineField({
      name: 'slides',
      title: 'Slides',
      type: 'array',
      of: [carouselSlide],
    }),
    skipTranslation(
      defineField({
        name: 'margin',
        title: 'Margin',
        type: 'string',
        description: 'Marked localize: false. It should not be serialized next to the heading.',
        options: {
          list: [
            {title: 'Spacious', value: 'spacious'},
            {title: 'Moderate', value: 'moderate'},
            {title: 'Tight', value: 'tight'},
          ],
        },
        initialValue: 'spacious',
      }),
    ),
  ],
})

export const naiveHtmlHeroSlides = defineType({
  name: 'naiveHtmlHeroSlides',
  title: 'Hero slides',
  type: 'array',
  of: [heroSlide],
})

export const naiveHtmlQuoteSlides = defineType({
  name: 'naiveHtmlQuoteSlides',
  title: 'Quote slides',
  type: 'array',
  of: [quoteSlide],
})

const carouselValue = {
  _type: 'naiveHtmlVideoCarousel',
  heading: 'Real videos by real people',
  margin: 'spacious',
  slides: [
    {
      _key: 'slide1',
      _type: 'slide',
      title: 'Clip',
      videoUrl: 'https://example.com/video.mp4',
    },
  ],
}

export const naiveHtmlSerializerPage = defineType({
  name: 'naiveHtmlSerializerPage',
  title: 'HTML Serializer Page',
  type: 'document',
  icon: DocumentTextIcon,
  description:
    'Open HTML Preview to see the translation payload. Translatable copy is included. localize: false values (margin, video URLs, theme, row token) are left out. settings.extraNote and rows.note are not schema fields; anonymous objects still include them.',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'naiveHtmlVideoCarousel',
      description: 'Nested object. Heading is translated. Margin and slide video URLs are not.',
    }),
    defineField({
      name: 'modules',
      title: 'Modules',
      type: 'array',
      of: [defineArrayMember({type: 'naiveHtmlVideoCarousel'})],
      description: 'Same module inside a page-builder array.',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      description: 'Portable Text. The sentence is included in the HTML preview.',
      of: [defineArrayMember({type: 'block'})],
    }),
    defineField({
      name: 'heroes',
      title: 'Hero slides',
      type: 'naiveHtmlHeroSlides',
      description:
        'Named array type. Its inline object is also called slide, with a different field list from Quote slides.',
    }),
    defineField({
      name: 'quotes',
      title: 'Quote slides',
      type: 'naiveHtmlQuoteSlides',
      description:
        'Quote and author are both translated. They must not be dropped because Hero slides also uses the name slide.',
    }),
    defineField({
      name: 'settings',
      title: 'Settings',
      type: 'object',
      description:
        'Anonymous object. Theme is localize: false. extraNote is not in the schema and is still sent.',
      fields: [
        defineField({name: 'title', title: 'Title', type: 'string'}),
        skipTranslation(defineField({name: 'theme', title: 'Theme', type: 'string'})),
      ],
    }),
    defineField({
      name: 'rows',
      title: 'Rows',
      type: 'array',
      description:
        'Unnamed object array. Studio stores these without _type. Label is translated, token is not, and the undeclared note is still sent.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'label', title: 'Label', type: 'string'}),
            skipTranslation(defineField({name: 'token', title: 'Token', type: 'string'})),
          ],
        }),
      ],
    }),
  ],
  initialValue: {
    title: 'Home',
    hero: carouselValue,
    modules: [{_key: 'module1', ...carouselValue}],
    body: [
      {
        _key: 'b1',
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [{_key: 's1', _type: 'span', text: 'Translate this sentence', marks: []}],
      },
    ],
    heroes: [
      {
        _key: 'h1',
        _type: 'slide',
        title: 'Hero title',
        videoUrl: 'https://cdn.example/a.mp4',
      },
    ],
    quotes: [{_key: 'q1', _type: 'slide', quote: 'A quoted line', author: 'Ada'}],
    settings: {_type: 'object', title: 'Hello', theme: 'dark', extraNote: 'keep me'},
    rows: [{_key: 'r1', label: 'Show me', token: 'secret-token', note: 'legacy'}],
  },
})
