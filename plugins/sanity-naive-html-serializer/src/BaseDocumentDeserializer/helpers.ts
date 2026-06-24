import {htmlToBlocks} from '@portabletext/block-tools'
import {Schema} from '@sanity/schema'
import type {ObjectField, PortableTextSpan, PortableTextTextBlock} from 'sanity'

const defaultSchema = Schema.compile({
  name: 'default',
  types: [
    {
      type: 'object',
      name: 'default',
      fields: [
        {
          name: 'block',
          type: 'array',
          of: [{type: 'block'}],
        },
      ],
    },
  ],
})

export const blockContentType = defaultSchema
  .get('default')
  .fields.find((field: ObjectField) => field.name === 'block').type

//helper to handle messy input -- take advantage
//of blockTools' sanitizing behavior for single strings
export const preprocess = (html: string): string => {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion - htmlToBlocks returns loosely typed portable text blocks
  const intermediateBlocks = htmlToBlocks(
    `<p>${html}</p>`,
    blockContentType,
  ) as PortableTextTextBlock<PortableTextSpan>[]
  if (!intermediateBlocks.length) {
    throw new Error(`Error parsing string '${html}'`)
  }
  const firstChild = intermediateBlocks[0]?.children?.[0]
  if (!firstChild || !('text' in firstChild)) {
    throw new Error(`Error parsing string '${html}'`)
  }
  return firstChild.text
}
