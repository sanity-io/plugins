import type {PortableTextTextBlock} from 'sanity'
import {vi} from 'vitest'

let mockTestKey = 0

vi.mock('@portabletext/block-tools', async () => {
  const originalModule = await vi.importActual<typeof import('@portabletext/block-tools')>(
    '@portabletext/block-tools',
  )
  return {
    ...originalModule,
    //not ideal but vi.mock('@sanity/block-tools/src/util/randomKey.ts' is not working
    htmlToBlocks: (html: string, blockContentType: any, options: any) => {
      const blocks = originalModule.htmlToBlocks(html, blockContentType, options)
      const newBlocks = blocks.map((block) => {
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion - test mock assigns keys to htmlToBlocks output
        const newChildren = (block as unknown as PortableTextTextBlock).children.map((child) => {
          return Object.assign(child, {_key: `randomKey-${mockTestKey++}`})
        })
        return Object.assign(block, {children: newChildren, _key: `randomKey-${mockTestKey++}`})
      })
      return newBlocks
    },
  }
})
