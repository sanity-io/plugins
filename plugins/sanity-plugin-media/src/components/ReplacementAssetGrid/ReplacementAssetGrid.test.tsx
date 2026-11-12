import {cleanup, screen} from '@testing-library/react'
import {afterEach, describe, expect, it} from 'vitest'

import {renderWithProviders} from '../../__tests__/fixtures/renderWithProviders'
import ReplacementAssetGrid from './index'

describe('ReplacementAssetGrid', () => {
  afterEach(() => {
    cleanup()
  })

  it('opts the grid scroller out of browser scroll anchoring', () => {
    renderWithProviders(
      <ReplacementAssetGrid items={[]} onLoadMore={() => {}} onSelect={() => {}} />,
    )

    expect(screen.getByTestId('virtuoso-scroller').style.overflowAnchor).toBe('none')
  })
})
