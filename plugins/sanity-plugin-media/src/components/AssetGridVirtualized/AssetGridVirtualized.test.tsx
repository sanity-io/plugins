import {screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {imageAsset} from '../../__tests__/fixtures/documents'
import {renderWithMedia} from '../../__tests__/fixtures/renderWithMedia'
import AssetGridVirtualized from './index'

describe('AssetGridVirtualized', () => {
  it('opts the grid scroller out of browser scroll anchoring', async () => {
    await renderWithMedia(<AssetGridVirtualized items={[{id: 'img-1', type: 'asset'}]} />, {
      assets: [imageAsset('img-1')],
    })

    expect(screen.getByTestId('virtuoso-scroller').style.overflowAnchor).toBe('none')
  })
})
