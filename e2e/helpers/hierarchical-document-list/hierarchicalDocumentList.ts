import {expect, type Page} from '@playwright/test'

import {createE2EClient} from '../e2eClient.js'
import {loadE2eEnvFiles, resolveE2eEnv} from '../env.js'

loadE2eEnvFiles()

/** Must match `HIERARCHY_TREE_DOCUMENT_ID` in `dev/e2e-studio/src/hierarchicalDocumentList.ts`. */
const TREE_DOCUMENT_ID = 'hierarchy-e2e-tree'
const BOOK_ID_PREFIX = 'hierarchy-e2e-book-'

/** Row titles are distinct words so a title never matches part of another row. */
export const BOOKS = {
  alpha: 'Alpha',
  bravo: 'Bravo',
  charlie: 'Charlie',
  delta: 'Delta',
} as const

export type BookKey = keyof typeof BOOKS

/** A tree row: the book it references and, for nested rows, its parent row. */
export type TreeRow = {key: BookKey; parent?: BookKey}

function datasetForProject(projectName: string | undefined): string {
  const env = resolveE2eEnv()
  if (projectName === 'firefox') return env.datasetFirefox
  return env.datasetChromium
}

/**
 * Replace the e2e tree document and the books it references.
 * Each row's `_key` is the book key, so outlines can be read back by key.
 */
export async function seedTree(projectName: string | undefined, rows: TreeRow[]): Promise<void> {
  const client = createE2EClient(datasetForProject(projectName))
  const transaction = client.transaction()

  for (const key of Object.keys(BOOKS) as BookKey[]) {
    transaction.createOrReplace({
      _id: BOOK_ID_PREFIX + key,
      _type: 'hierarchyBook',
      title: BOOKS[key],
    })
  }

  transaction.createOrReplace({
    _id: TREE_DOCUMENT_ID,
    _type: 'hierarchy.tree',
    tree: rows.map((row) => ({
      _key: row.key,
      _type: 'hierarchy.tree.node',
      parent: row.parent ?? null,
      value: {
        _type: 'hierarchy.tree.nodeValue',
        docType: 'hierarchyBook',
        reference: {_type: 'reference', _ref: BOOK_ID_PREFIX + row.key, _weak: true},
      },
    })),
  })

  await transaction.commit({visibility: 'sync'})
}

export async function deleteTree(projectName: string | undefined): Promise<void> {
  const client = createE2EClient(datasetForProject(projectName))
  const transaction = client.transaction().delete(TREE_DOCUMENT_ID)
  for (const key of Object.keys(BOOKS)) transaction.delete(BOOK_ID_PREFIX + key)
  await transaction.commit({visibility: 'async'}).catch(() => undefined)
}

type StoredNode = {_key: string; parent?: string | null}

/**
 * The stored tree as an outline of row keys, e.g. `alpha[bravo], charlie`.
 * Siblings keep the order of the stored array, like the plugin renders them.
 */
export async function storedOutline(projectName: string | undefined): Promise<string> {
  const client = createE2EClient(datasetForProject(projectName))
  const doc = await client.getDocument<{tree?: StoredNode[]}>(TREE_DOCUMENT_ID)
  const tree = doc?.tree ?? []

  const render = (parent: string | null): string =>
    tree
      .filter((node) => (node.parent || null) === parent)
      .map((node) => {
        const children = render(node._key)
        return children ? `${node._key}[${children}]` : node._key
      })
      .join(', ')

  return render(null)
}

/**
 * The rendered tree as the same outline, using each row's indentation for its depth.
 */
export async function visibleOutline(page: Page): Promise<string> {
  const rows = await page.locator('[data-tree-row]').evaluateAll((elements) =>
    elements.map((element) => ({
      text: element.textContent ?? '',
      indent: Number.parseFloat(
        (element.firstElementChild as HTMLElement | null)?.style.paddingLeft ?? '0',
      ),
    })),
  )
  const titleToKey = Object.entries(BOOKS)
  const minIndent = Math.min(...rows.map((row) => row.indent))

  let outline = ''
  let previousDepth = 0
  rows.forEach((row, index) => {
    const key = titleToKey.find(([, title]) => row.text.includes(title))?.[0] ?? '?'
    // Each nesting level adds 14px of padding (see TreeNodeRenderer)
    const depth = Math.round((row.indent - minIndent) / 14)
    if (index > 0) {
      if (depth > previousDepth) outline += '['
      else outline += ']'.repeat(previousDepth - depth) + ', '
    }
    outline += key
    previousDepth = depth
  })
  return outline + ']'.repeat(previousDepth)
}

export async function openTree(page: Page, rows: TreeRow[]): Promise<void> {
  await page.goto(`structure/${TREE_DOCUMENT_ID}`)
  await expect(page.locator('[data-tree-row]')).toHaveCount(rows.length)
  for (const row of rows) {
    await expect(treeRow(page, BOOKS[row.key])).toBeVisible()
  }
}

function treeRow(page: Page, title: string) {
  return page.locator('[data-tree-row]').filter({hasText: title})
}

/**
 * Drag a row by its handle with real mouse movement, so react-dnd's HTML5 backend sees
 * native drag events. `over` hovers another row (the dragged row takes its place);
 * `dx` shifts the pointer sideways, one nesting level per 44px (`scaffoldBlockPxWidth`).
 */
export async function dragRow(
  page: Page,
  title: string,
  {over, dx = 0}: {over?: string; dx?: number},
): Promise<void> {
  const handle = treeRow(page, title).locator('[data-ui="DragHandleButton"]')
  const start = await handle.boundingBox()
  if (!start) throw new Error(`No drag handle for "${title}"`)
  const x = start.x + start.width / 2
  const y = start.y + start.height / 2

  let targetY = y
  if (over) {
    const target = await treeRow(page, over).boundingBox()
    if (!target) throw new Error(`No row "${over}"`)
    targetY = target.y + target.height / 2
  }

  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + 2, y + 2, {steps: 2})
  await page.mouse.move(x + dx, targetY, {steps: 20})
  await page.waitForTimeout(300)
  await page.mouse.up()
}
