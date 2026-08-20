import {firstValueFrom} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {generatePreviewBlobUrl$} from './generatePreviewBlobUrl'

describe('generatePreviewBlobUrl$', () => {
  beforeEach(() => {
    class MockImage {
      onload: (() => void) | null = null
      width = 400
      height = 200
      private _src = ''
      get src() {
        return this._src
      }
      set src(v: string) {
        this._src = v
        queueMicrotask(() => this.onload?.())
      }
    }
    vi.stubGlobal('Image', MockImage)

    // Allocate with a string literal before spying so TS picks the non-deprecated canvas overload.
    const templateCanvas = document.createElement('canvas')
    const templateDiv = document.createElement('div')
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        const el = templateCanvas.cloneNode(false) as HTMLCanvasElement
        vi.spyOn(el, 'getContext').mockReturnValue({
          drawImage: vi.fn(),
        } as unknown as CanvasRenderingContext2D)
        el.toBlob = function toBlob(cb: ((blob: Blob | null) => void) | null | undefined) {
          if (cb) {
            cb(new Blob(['x'], {type: 'image/jpeg'}))
          }
        }
        return el
      }
      return templateDiv.cloneNode(false) as HTMLElement
    })

    const createObjectURL = vi.fn(() => 'blob:mock-preview')
    const revokeObjectURL = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectURL,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectURL,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    delete (URL as Partial<typeof URL> & {createObjectURL?: unknown}).createObjectURL
    delete (URL as Partial<typeof URL> & {revokeObjectURL?: unknown}).revokeObjectURL
  })

  it('emits a blob URL when canvas preview succeeds', async () => {
    const url = await firstValueFrom(
      generatePreviewBlobUrl$(new File(['x'], 'photo.jpg', {type: 'image/jpeg'})),
    )
    expect(url).toBe('blob:mock-preview')
  })
})
