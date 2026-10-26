import {expect, test} from '@playwright/test'

import {
  BOOKS,
  deleteTree,
  dragRow,
  openTree,
  seedTree,
  storedOutline,
  type TreeRow,
  visibleOutline,
} from '../../helpers/hierarchical-document-list/hierarchicalDocumentList.js'

// Every test rewrites the same tree document, which the structure item is configured with.
test.describe.configure({mode: 'serial'})

test.describe('@sanity/hierarchical-document-list', () => {
  const cases: {
    name: string
    rows: TreeRow[]
    drag: {title: string; over?: string; dx?: number}
    expected: string
  }[] = [
    {
      name: 'moves an item up within the same level',
      rows: [{key: 'alpha'}, {key: 'bravo'}, {key: 'charlie'}],
      drag: {title: BOOKS.charlie, over: BOOKS.alpha},
      expected: 'charlie, alpha, bravo',
    },
    {
      name: 'moves an item down within the same level',
      rows: [{key: 'alpha'}, {key: 'bravo'}, {key: 'charlie'}],
      drag: {title: BOOKS.alpha, over: BOOKS.charlie},
      expected: 'bravo, charlie, alpha',
    },
    {
      name: 'nests an item under the item above it',
      rows: [{key: 'alpha'}, {key: 'bravo'}, {key: 'charlie'}],
      drag: {title: BOOKS.bravo, dx: 60},
      expected: 'alpha[bravo], charlie',
    },
    {
      name: 'moves a nested item out to the root',
      rows: [{key: 'alpha'}, {key: 'bravo', parent: 'alpha'}, {key: 'charlie'}],
      // The handle sits ~25px from the row's left edge; past it there is nothing to drop on
      drag: {title: BOOKS.bravo, dx: -30},
      expected: 'alpha, bravo, charlie',
    },
    {
      name: 'moves an item together with its nested children',
      rows: [{key: 'alpha'}, {key: 'bravo'}, {key: 'delta', parent: 'bravo'}, {key: 'charlie'}],
      drag: {title: BOOKS.bravo, over: BOOKS.alpha},
      expected: 'bravo[delta], alpha, charlie',
    },
  ]

  for (const {name, rows, drag, expected} of cases) {
    test(name, async ({page}, testInfo) => {
      const projectName = testInfo.project.name
      await seedTree(projectName, rows)

      try {
        await openTree(page, rows)
        await dragRow(page, drag.title, drag)

        await expect.poll(() => storedOutline(projectName)).toBe(expected)
        await expect.poll(() => visibleOutline(page)).toBe(expected)
      } finally {
        await deleteTree(projectName)
      }
    })
  }
})
