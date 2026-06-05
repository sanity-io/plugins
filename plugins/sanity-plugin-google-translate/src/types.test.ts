import type {ObjectOptions} from 'sanity'
import {expectTypeOf, test} from 'vitest'

test('extends Sanity object schema options', () => {
  expectTypeOf<ObjectOptions>().toExtend<{
    translate?: boolean
    apiKey?: string
  }>()
})
