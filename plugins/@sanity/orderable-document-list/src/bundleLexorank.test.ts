import {readFileSync, readdirSync} from 'node:fs'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'

import {LexoRank} from 'lexorank'
import {expect, test} from 'vitest'

import {orderRankField} from './fields/orderRankField'

const distDir = fileURLToPath(new URL('../dist', import.meta.url))

function isPublishedBundle(value: unknown): value is {orderRankField: typeof orderRankField} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'orderRankField' in value &&
    typeof value.orderRankField === 'function'
  )
}

async function rankFromPublishedBundle(fetched: string | undefined): Promise<unknown> {
  const loaded: unknown = await import(new URL('../dist/index.js', import.meta.url).href)
  if (!isPublishedBundle(loaded)) {
    throw new Error('published bundle is missing orderRankField')
  }

  const field = loaded.orderRankField({type: 'category'})
  if (typeof field.initialValue !== 'function') {
    throw new Error('orderRankField initialValue should be a function')
  }

  return field.initialValue(undefined, {
    getClient: () => ({
      fetch: async () => fetched,
    }),
  })
}

test('published bundle inlines lexorank instead of importing the CJS package', async () => {
  const files = readdirSync(distDir).filter((name) => name.endsWith('.js'))
  expect(files.length).toBeGreaterThan(0)

  for (const file of files) {
    const source = readFileSync(join(distDir, file), 'utf8')
    expect(source, file).not.toMatch(/['"]lexorank['"]/)
  }

  // Same path Studio schema extraction uses for a new document: no previous rank.
  const empty = await rankFromPublishedBundle(undefined)
  expect(empty).toBe(LexoRank.min().genNext().genNext().toString())

  const previous = '0|10000o:'
  const next = await rankFromPublishedBundle(previous)
  expect(next).toBe(LexoRank.parse(previous).genNext().genNext().toString())
})
