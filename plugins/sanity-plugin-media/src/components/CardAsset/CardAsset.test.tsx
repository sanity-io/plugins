import {act, fireEvent, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {Profiler} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {fileAsset, imageAsset} from '../../__tests__/fixtures/documents'
import {mockPatchChain} from '../../__tests__/fixtures/mockSanityClient'
import {renderWithMedia} from '../../__tests__/fixtures/renderWithMedia'
import type {MediaActors} from '../../contexts/MediaActorsContext'
import {selectPickedAssets} from '../../machines/assetsMachine'
import {assetEditDialog, replaceAssetDialog} from '../../machines/dialogs'
import {ASSET_DRAG_TYPE} from '../../utils/assetDrag'
import CardAsset from './index'

vi.mock('../Image', () => ({
  default: () => <div data-testid="card-image" />,
}))

vi.mock('../FileIcon', () => ({
  default: ({extension}: {extension?: string}) => (
    <div data-testid="card-file-icon" data-extension={extension ?? ''} />
  ),
}))

const photo = imageAsset('img-1', {originalFilename: 'photo.png'})
const replacement = imageAsset('img-2', {originalFilename: 'replacement.png'})
const pdf = fileAsset('file-1', {originalFilename: 'doc.pdf'})

const preview = (assetId: string) => screen.getByTestId(`media-asset-card-${assetId}`)
const footer = (filename: string) => screen.getByText(filename)

const pickedIds = ({assets}: MediaActors) =>
  selectPickedAssets(assets.getSnapshot()).map((item) => item.asset._id)
const dialogItems = ({dialogs}: MediaActors) => dialogs.getSnapshot().context.items

describe('CardAsset', () => {
  it('renders nothing when the asset is not listed', async () => {
    await renderWithMedia(<CardAsset id="missing" selected={false} />, {assets: [photo]})

    expect(screen.queryByTestId('card-image')).not.toBeInTheDocument()
    expect(screen.queryByTestId('card-file-icon')).not.toBeInTheDocument()
  })

  it('renders the image preview and original filename of images', async () => {
    await renderWithMedia(<CardAsset id="img-1" selected={false} />, {assets: [photo]})

    expect(screen.getByTestId('card-image')).toBeInTheDocument()
    expect(screen.getByText('photo.png')).toBeInTheDocument()
  })

  it('renders the extension icon of files', async () => {
    await renderWithMedia(<CardAsset id="file-1" selected={false} />, {assets: [pdf]})

    expect(screen.getByTestId('card-file-icon')).toHaveAttribute('data-extension', 'pdf')
    expect(screen.getByText('doc.pdf')).toBeInTheDocument()
  })

  describe('browsing', () => {
    it('opens the asset when the preview is clicked', async () => {
      const user = userEvent.setup()
      const {actors} = await renderWithMedia(<CardAsset id="img-1" selected={false} />, {
        assets: [photo],
      })

      await user.click(preview('img-1'))

      expect(dialogItems(actors)).toEqual([assetEditDialog('img-1')])
    })

    it('toggles the pick when the footer is clicked', async () => {
      const user = userEvent.setup()
      const {actors} = await renderWithMedia(<CardAsset id="img-1" selected={false} />, {
        assets: [photo],
      })

      await user.click(footer('photo.png'))
      expect(pickedIds(actors)).toEqual(['img-1'])
      expect(screen.getByRole('checkbox')).toBeChecked()

      await user.click(footer('photo.png'))
      expect(pickedIds(actors)).toEqual([])
    })

    it('toggles the pick without opening the asset when the preview is ctrl-clicked', async () => {
      const user = userEvent.setup()
      const {actors} = await renderWithMedia(<CardAsset id="img-1" selected={false} />, {
        assets: [photo],
      })

      await user.keyboard('{Control>}')
      await user.click(preview('img-1'))
      expect(pickedIds(actors)).toEqual(['img-1'])

      await user.click(preview('img-1'))
      await user.keyboard('{/Control}')
      expect(pickedIds(actors)).toEqual([])
      expect(dialogItems(actors)).toEqual([])
    })

    it('picks the range from the last picked asset when shift-clicked', async () => {
      const user = userEvent.setup()
      const {actors} = await renderWithMedia(
        <>
          <CardAsset id="prev-1" selected={false} />
          <CardAsset id="img-1" selected={false} />
        </>,
        {assets: [imageAsset('prev-1'), imageAsset('between'), photo]},
      )
      actors.assets.send({type: 'pick.toggle', assetId: 'prev-1'})

      await user.keyboard('{Shift>}')
      await user.click(preview('img-1'))
      expect(pickedIds(actors)).toEqual(['prev-1', 'between', 'img-1'])

      // Shift-clicking a picked asset unpicks it
      await user.click(preview('img-1'))
      await user.keyboard('{/Shift}')
      expect(pickedIds(actors)).toEqual(['prev-1', 'between'])
    })

    it('picks the range from the last picked asset when the footer is shift-clicked', async () => {
      const user = userEvent.setup()
      const {actors} = await renderWithMedia(<CardAsset id="img-1" selected={false} />, {
        assets: [imageAsset('anchor'), photo],
      })
      actors.assets.send({type: 'pick.toggle', assetId: 'anchor'})

      await user.keyboard('{Shift>}')
      await user.click(footer('photo.png'))
      await user.keyboard('{/Shift}')

      expect(pickedIds(actors)).toEqual(['anchor', 'img-1'])
    })
  })

  describe('picking assets for a field', () => {
    it('selects the asset when the preview is clicked', async () => {
      const user = userEvent.setup()
      const onSelect = vi.fn()
      await renderWithMedia(<CardAsset id="img-1" selected={false} />, {
        assets: [photo],
        onSelect,
      })

      await user.click(preview('img-1'))

      expect(onSelect).toHaveBeenCalledWith([{kind: 'assetDocumentId', value: 'img-1'}])
    })

    it('opens the asset when the footer is clicked', async () => {
      const user = userEvent.setup()
      const onSelect = vi.fn()
      const {actors} = await renderWithMedia(<CardAsset id="img-1" selected={false} />, {
        assets: [photo],
        onSelect,
      })

      await user.click(footer('photo.png'))

      expect(onSelect).not.toHaveBeenCalled()
      expect(dialogItems(actors)).toEqual([assetEditDialog('img-1')])
    })

    it('does nothing when the asset is already selected in the field', async () => {
      const user = userEvent.setup()
      const onSelect = vi.fn()
      const {actors} = await renderWithMedia(<CardAsset id="img-1" selected />, {
        assets: [photo],
        onSelect,
      })

      await user.click(preview('img-1'))
      await user.click(footer('photo.png'))

      expect(onSelect).not.toHaveBeenCalled()
      expect(dialogItems(actors)).toEqual([])
    })

    it('picks assets, and ranges of assets, when the field accepts several', async () => {
      const user = userEvent.setup()
      const onSelect = vi.fn()
      const {actors} = await renderWithMedia(
        <>
          <CardAsset id="first" selected={false} />
          <CardAsset id="img-1" selected={false} />
        </>,
        {
          assets: [imageAsset('first'), imageAsset('between'), photo],
          isMultiSelect: true,
          onSelect,
        },
      )

      await user.click(preview('first'))
      await user.keyboard('{Shift>}')
      await user.click(preview('img-1'))
      await user.keyboard('{/Shift}')

      expect(onSelect).not.toHaveBeenCalled()
      expect(pickedIds(actors)).toEqual(['first', 'between', 'img-1'])
    })
  })

  describe('status', () => {
    it('shows a check mark over assets selected in the field', async () => {
      const {container} = await renderWithMedia(<CardAsset id="img-1" selected />, {
        assets: [photo],
      })

      expect(container.querySelector('[data-sanity-icon="checkmark-circle"]')).toBeInTheDocument()
    })

    it('shows a spinner instead of the check mark while the asset is updating', async () => {
      const {actors, client, container} = await renderWithMedia(<CardAsset id="img-1" selected />, {
        assets: [photo],
      })
      client.patch.mockReturnValue(mockPatchChain(new Promise(() => undefined)))

      act(() => actors.assets.send({type: 'asset.update', asset: photo, formData: {}}))

      expect(container.querySelector('[data-ui="Spinner"]')).toBeInTheDocument()
      expect(
        container.querySelector('[data-sanity-icon="checkmark-circle"]'),
      ).not.toBeInTheDocument()
    })

    it('shows a warning when the last change to the asset failed', async () => {
      const {actors, client, container} = await renderWithMedia(
        <CardAsset id="img-1" selected={false} />,
        {assets: [photo]},
      )
      const patch = mockPatchChain()
      patch.commit.mockRejectedValue({message: 'Revision mismatch', statusCode: 409})
      client.patch.mockReturnValue(patch)

      act(() => actors.assets.send({type: 'asset.update', asset: photo, formData: {}}))

      await waitFor(() =>
        expect(container.querySelector('[data-sanity-icon="warning-filled"]')).toBeInTheDocument(),
      )
    })
  })

  describe('replacing an asset', () => {
    const replaceEvent = {type: 'asset.references.replace', asset: replacement, targetId: 'img-1'}

    it('re-points references to the asset being replaced when the preview is clicked', async () => {
      const user = userEvent.setup()
      const {actors} = await renderWithMedia(
        <CardAsset id="img-2" selected={false} source="replace-asset" />,
        {assets: [photo, replacement]},
      )
      actors.dialogs.send({type: 'dialog.open', dialog: replaceAssetDialog('img-1')})
      const send = vi.spyOn(actors.assets, 'send')

      await user.click(preview('img-2'))

      expect(send).toHaveBeenCalledExactlyOnceWith(replaceEvent)
      expect(dialogItems(actors)).toEqual([])
      expect(await screen.findByText(/Updating in progress/)).toBeInTheDocument()
    })

    it('replaces the only picked asset when the footer is clicked', async () => {
      const user = userEvent.setup()
      const {actors} = await renderWithMedia(
        <CardAsset id="img-2" selected={false} source="replace-asset" />,
        {assets: [photo, replacement]},
      )
      actors.assets.send({type: 'pick.toggle', assetId: 'img-1'})
      const send = vi.spyOn(actors.assets, 'send')

      await user.click(footer('replacement.png'))

      expect(send).toHaveBeenCalledExactlyOnceWith(replaceEvent)
    })

    it('does not replace an asset that is still updating', async () => {
      const user = userEvent.setup()
      const {actors, client} = await renderWithMedia(
        <CardAsset id="img-2" selected={false} source="replace-asset" />,
        {assets: [photo, replacement]},
      )
      client.patch.mockReturnValue(mockPatchChain(new Promise(() => undefined)))
      actors.assets.send({type: 'asset.update', asset: photo, formData: {}})
      actors.dialogs.send({type: 'dialog.open', dialog: replaceAssetDialog('img-1')})
      const send = vi.spyOn(actors.assets, 'send')

      await user.click(preview('img-2'))

      expect(send).not.toHaveBeenCalled()
      expect(dialogItems(actors)).toEqual([replaceAssetDialog('img-1')])
    })
  })

  describe('dragging', () => {
    const dragStart = (element: HTMLElement) => {
      const data = new Map<string, string>()
      fireEvent.dragStart(element, {
        dataTransfer: {setData: (type: string, value: string) => data.set(type, value)},
      })
      return JSON.parse(data.get(ASSET_DRAG_TYPE) ?? 'null') as string[] | null
    }
    const draggableOf = (assetId: string) => preview(assetId).closest<HTMLElement>('[draggable]')!

    it('drags every picked asset when a picked asset is dragged', async () => {
      const {actors} = await renderWithMedia(<CardAsset id="img-1" selected={false} />, {
        assets: [photo, replacement],
      })
      act(() => {
        actors.assets.send({type: 'pick.toggle', assetId: 'img-1'})
        actors.assets.send({type: 'pick.toggle', assetId: 'img-2'})
      })

      expect(dragStart(draggableOf('img-1'))).toEqual(['img-1', 'img-2'])
    })

    it('drags only the asset itself when it is not picked', async () => {
      const {actors} = await renderWithMedia(<CardAsset id="img-1" selected={false} />, {
        assets: [photo, replacement],
      })
      act(() => actors.assets.send({type: 'pick.toggle', assetId: 'img-2'}))

      expect(dragStart(draggableOf('img-1'))).toEqual(['img-1'])
    })

    it('cannot drag assets selected in the field', async () => {
      await renderWithMedia(<CardAsset id="img-1" selected />, {assets: [photo]})

      expect(draggableOf('img-1')).toHaveAttribute('draggable', 'false')
    })
  })

  it('only re-renders the card of the asset that changed', async () => {
    const renders: string[] = []
    const onRender = (id: string) => renders.push(id)
    const {actors} = await renderWithMedia(
      <>
        <Profiler id="img-1" onRender={onRender}>
          <CardAsset id="img-1" selected={false} />
        </Profiler>
        <Profiler id="img-2" onRender={onRender}>
          <CardAsset id="img-2" selected={false} />
        </Profiler>
      </>,
      {assets: [photo, replacement]},
    )
    renders.length = 0

    act(() => actors.assets.send({type: 'pick.toggle', assetId: 'img-1'}))
    act(() => actors.assets.send({type: 'view.set', view: 'table'}))

    expect(renders).toEqual(['img-1', 'img-1'])
  })
})
