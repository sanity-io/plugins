// @vitest-environment jsdom
/**
 * Reproduction for the hierarchy view hanging on trees of a few dozen documents.
 *
 * Each row used to mount the scaffold's global stylesheet. styled-components
 * keeps one instance per mount and, on unmount, clears and reinserts every
 * surviving instance. Leaving the view therefore rebuilds the group once per
 * row. Measured under jsdom with speedy CSS injection disabled (the Studio
 * development path):
 *
 * - 8 rows: 32 keyframe copies, unmount ~0.5s
 * - 16 rows: 64 keyframe copies, unmount ~3.5s
 *
 * The reported case is ~40 documents. Copies below are counted before unmount
 * so a failing run does not sit in that quadratic teardown.
 */
import {act, createElement} from 'react'
import {createRoot, type Root} from 'react-dom/client'
import {expect, test} from 'vitest'

import TreeNodeRendererScaffold from './TreeNodeRendererScaffold'

const KEYFRAME = 'arrow-pulse'

;(globalThis as {IS_REACT_ACT_ENVIRONMENT?: boolean}).IS_REACT_ACT_ENVIRONMENT = true

function countKeyframeCopies(): number {
  let copies = 0
  for (const node of document.querySelectorAll('style')) {
    const style = node as HTMLStyleElement
    const sheet = style.sheet
    if (sheet && sheet.cssRules.length > 0) {
      for (const rule of sheet.cssRules) {
        if (rule.cssText.includes(KEYFRAME)) copies += 1
      }
      continue
    }
    const text = style.textContent || ''
    if (text) copies += text.split(KEYFRAME).length - 1
  }
  return copies
}

function scaffoldProps(index: number) {
  return {
    lowerSiblingCounts: [0],
    scaffoldBlockPxWidth: 44,
    listIndex: index,
    swapDepth: undefined,
    swapFrom: undefined,
    swapLength: undefined,
    treeIndex: index,
  }
}

async function mountRows(size: number): Promise<{copies: number; unmount: () => Promise<void>}> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root: Root = createRoot(container)
  await act(async () => {
    root.render(
      createElement(
        'div',
        null,
        Array.from({length: size}, (_, index) =>
          createElement(TreeNodeRendererScaffold, {key: index, ...scaffoldProps(index)}),
        ),
      ),
    )
  })
  const copies = countKeyframeCopies()
  return {
    copies,
    unmount: async () => {
      await act(async () => {
        root.unmount()
      })
      container.remove()
    },
  }
}

test('scaffold styles do not grow with the number of rows', {timeout: 15_000}, async () => {
  const oneRow = await mountRows(1)
  const oneCopies = oneRow.copies
  // Unmount the single row before mounting the large tree. Tearing one
  // instance down while dozens of copies are still mounted is the hang.
  await oneRow.unmount()

  const reportedTree = await mountRows(40)
  try {
    // One injection mentions the keyframe a handful of times (including prefixes).
    // Forty rows must not multiply that.
    expect(oneCopies).toBeGreaterThan(0)
    expect(reportedTree.copies).toBe(oneCopies)
  } finally {
    // Skip the quadratic teardown when the assertion already failed.
    if (reportedTree.copies === oneCopies) {
      const started = performance.now()
      await reportedTree.unmount()
      expect(performance.now() - started).toBeLessThan(1_000)
    }
  }
})
