import {expect, test} from 'vitest'

import * as namedExports from './index'

test('package exports should be stable', () => {
  expect(Object.keys(namedExports).toSorted()).toMatchInlineSnapshot(`
    [
      "clear",
      "internationalizedArray",
      "peek",
      "preload",
    ]
  `)
})
