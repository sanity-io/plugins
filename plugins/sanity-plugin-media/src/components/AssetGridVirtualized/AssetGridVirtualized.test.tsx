import {cleanup, screen} from '@testing-library/react'
import {afterEach, describe, expect, it} from 'vitest'

import {renderWithProviders} from '../../__tests__/fixtures/renderWithProviders'
import AssetGridVirtualized from './index'

describe('AssetGridVirtualized', () => {
  afterEach(() => {
    cleanup()
  })

  it('opts the grid scroller out of browser scroll anchoring', () => {
    renderWithProviders(<AssetGridVirtualized items={[{id: 'img-1', type: 'asset'}]} />)

    expect(screen.getByTestId('virtuoso-scroller').style.overflowAnchor).toBe('none')
  })
})
