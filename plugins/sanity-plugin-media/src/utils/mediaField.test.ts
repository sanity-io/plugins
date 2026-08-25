// @vitest-environment node

import {describe, expect, it} from 'vitest'

import {AutoTagInput} from '../components/AutoTagInputWrapper'
import {mediaField} from './mediaField'

describe('mediaField', () => {
  it('moves mediaTags into options and wires AutoTagInput for image fields', () => {
    const field = mediaField({
      name: 'coverImage',
      type: 'image',
      title: 'Cover',
      mediaTags: ['product-cover'],
      options: {hotspot: true},
    })

    expect(field.name).toBe('coverImage')
    expect(field.type).toBe('image')
    expect(field.options).toEqual({hotspot: true, mediaTags: ['product-cover']})
    expect(field.components?.input).toBe(AutoTagInput)
    expect('mediaTags' in field).toBe(false)
  })

  it('supports file fields', () => {
    const field = mediaField({
      name: 'drawing',
      type: 'file',
      mediaTags: ['model-drawing'],
    })

    expect(field.type).toBe('file')
    expect(field.options).toEqual({mediaTags: ['model-drawing']})
    expect(field.components?.input).toBe(AutoTagInput)
  })

  it('preserves existing components while overriding input', () => {
    const CustomField = () => null
    const field = mediaField({
      name: 'image',
      type: 'image',
      mediaTags: ['a'],
      components: {field: CustomField} as never,
    })

    expect(field.components).toMatchObject({
      field: CustomField,
      input: AutoTagInput,
    })
  })
})
