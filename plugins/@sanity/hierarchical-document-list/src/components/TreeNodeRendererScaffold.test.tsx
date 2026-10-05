// @vitest-environment jsdom
/**
 * Regression for the hierarchy view hanging on trees of a few dozen documents.
 *
 * Each row used to mount the scaffold's global stylesheet. styled-components
 * keeps one instance per mount and, on unmount, clears and reinserts every
 * surviving instance. Leaving the view therefore rebuilt the group once per
 * row. Measured under jsdom against the browser build of styled-components:
 *
 * - 1 row: 2 keyframe copies
 * - 40 rows: 80 keyframe copies, and tearing them down exceeds several seconds
 *
 * Copies are counted before unmount so a failing run does not sit in that teardown.
 */
import {act} from 'react'
import {createRoot, type Root} from 'react-dom/client'
import {expect, test} from 'vitest'

import TreeNodeRendererScaffold, {TreeScaffoldStyles} from './TreeNodeRendererScaffold'

const KEYFRAME = 'arrow-pulse'

;(globalThis as {IS_REACT_ACT_ENVIRONMENT?: boolean}).IS_REACT_ACT_ENVIRONMENT = true

function countKeyframeCopies(): number {
  let copies = 0
  for (const style of document.querySelectorAll('style')) {
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

function ScaffoldRows({size, sharedSheet}: {size: number; sharedSheet: boolean}) {
  return (
    <>
      {sharedSheet ? <TreeScaffoldStyles /> : null}
      {Array.from({length: size}, (_, index) => (
        <TreeNodeRendererScaffold key={index} {...scaffoldProps(index)} />
      ))}
    </>
  )
}

async function mount(
  size: number,
  sharedSheet: boolean,
): Promise<{copies: number; unmount: () => Promise<void>}> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root: Root = createRoot(container)
  await act(async () => {
    root.render(
      <div>
        <ScaffoldRows size={size} sharedSheet={sharedSheet} />
      </div>,
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

test('rows do not each inject scaffold styles', async () => {
  const reportedTree = await mount(40, false)
  try {
    expect(reportedTree.copies).toBe(0)
  } finally {
    if (reportedTree.copies === 0) await reportedTree.unmount()
  }
})

test('scaffold styles are injected once for the whole tree', {timeout: 15_000}, async () => {
  const oneRow = await mount(1, true)
  const oneCopies = oneRow.copies
  await oneRow.unmount()

  const reportedTree = await mount(40, true)
  try {
    expect(oneCopies).toBeGreaterThan(0)
    expect(reportedTree.copies).toBe(oneCopies)
  } finally {
    if (reportedTree.copies === oneCopies) {
      const started = performance.now()
      await reportedTree.unmount()
      expect(performance.now() - started).toBeLessThan(1_000)
    }
  }
})
