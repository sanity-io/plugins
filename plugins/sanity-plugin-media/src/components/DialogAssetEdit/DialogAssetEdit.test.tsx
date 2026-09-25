import {act, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type {Subject} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {
  assetItem,
  folderReference,
  imageAsset,
  tag,
  tagReference,
} from '../../__tests__/fixtures/documents'
import {createMediaFetchMock, type MediaFixtures} from '../../__tests__/fixtures/mediaFetchMock'
import {mockPatchChain, mockTransaction} from '../../__tests__/fixtures/mockSanityClient'
import {renderDialog} from '../../__tests__/fixtures/renderWithMedia'
import {getDialogRoot, inputByName, withinDialog} from '../../__tests__/fixtures/withinDialog'
import {
  assetEditDialog,
  confirmDeleteAssetsDialog,
  folderMoveDialog,
  tagsDialog,
} from '../../machines/dialogs'
import type {ImageAsset, MediaToolOptions} from '../../types'

vi.mock('../Image', () => ({default: () => null}))
vi.mock('../FileAssetPreview', () => ({default: () => null}))
vi.mock('../DocumentList', () => ({default: () => null}))
vi.mock('../AssetMetadata', () => ({default: () => null}))

vi.mock('sanity', async (importOriginal) => {
  const actual = await importOriginal<typeof import('sanity')>()
  return {
    ...actual,
    WithReferringDocuments: ({children}: {children: (args: unknown) => unknown}) =>
      children({isLoading: false, referringDocuments: []}),
    useDocumentStore: () => ({}),
  }
})

const dialogName = /asset details/i
const photo = imageAsset('a1')
const inProducts = imageAsset('a1', {opt: {media: {folder: folderReference('folder.products')}}})

function renderAssetDialog(
  asset: ImageAsset = photo,
  {toolOptions, ...fixtures}: MediaFixtures & {toolOptions?: Partial<MediaToolOptions>} = {},
) {
  return renderDialog(assetEditDialog('a1'), {
    assets: [asset],
    toolOptions: {creditLine: {enabled: true}, ...toolOptions},
    ...fixtures,
  })
}

const dialog = () => withinDialog(dialogName, screen)
const saveButton = () => dialog().getByRole('button', {name: /save and close/i})
const field = (name: string) => inputByName(dialogName, screen, name)
const textarea = (name: string) =>
  getDialogRoot(dialogName, screen).querySelector<HTMLTextAreaElement>(`textarea[name="${name}"]`)!

const withImageDescription = (description: string): ImageAsset['metadata'] => ({
  ...photo.metadata,
  image: {_type: 'sanity.imageExifTags', ImageDescription: description},
})

describe('DialogAssetEdit', () => {
  it('shows the details of the asset', async () => {
    await renderAssetDialog()

    expect(dialog().getByText('Asset details')).toBeInTheDocument()
    expect(dialog().getByRole('tab', {name: 'Details'})).toHaveAttribute('aria-selected', 'true')
    expect(field('originalFilename')).toHaveValue('a1.png')
  })

  it('switches to the References tab', async () => {
    const user = userEvent.setup()
    await renderAssetDialog()
    const referencesTab = dialog().getByRole('tab', {name: /references/i})

    await user.click(referencesTab)

    expect(referencesTab).toHaveAttribute('aria-selected', 'true')
    expect(dialog().getByRole('tab', {name: 'Details'})).toHaveAttribute('aria-selected', 'false')
  })

  describe('saving', () => {
    it('keeps Save disabled until a field is edited', async () => {
      const user = userEvent.setup()
      await renderAssetDialog()
      expect(saveButton()).toBeDisabled()

      await user.type(field('title'), 'Hero image')

      await waitFor(() => expect(saveButton()).toBeEnabled())
    })

    it('saves the changes, then closes', async () => {
      const user = userEvent.setup()
      const {actors, client} = await renderAssetDialog()
      const patch = mockPatchChain(imageAsset('a1', {title: 'Hero image'}))
      client.patch.mockReturnValue(patch)

      await user.type(field('title'), 'Hero image')
      await user.click(saveButton())

      await waitFor(() => expect(actors.dialogs.getSnapshot().context.items).toEqual([]))
      expect(client.patch).toHaveBeenCalledWith('a1')
      expect(patch.set).toHaveBeenCalledWith(
        expect.objectContaining({originalFilename: 'a1.png', title: 'Hero image'}),
      )
      expect(actors.assets.getSnapshot().context.byIds['a1']?.asset.title).toBe('Hero image')
    })

    it('keeps the folder of the asset', async () => {
      const user = userEvent.setup()
      const {client} = await renderAssetDialog(inProducts)
      const patch = mockPatchChain(inProducts)
      client.patch.mockReturnValue(patch)

      await user.type(field('title'), 'New title')
      await user.click(saveButton())

      await waitFor(() => expect(patch.set).toHaveBeenCalled())
      expect(patch.set.mock.lastCall?.[0].opt.media.folder).toEqual(
        folderReference('folder.products'),
      )
    })

    it('shows the asset as busy while saving', async () => {
      const user = userEvent.setup()
      const {client} = await renderAssetDialog()
      client.patch.mockReturnValue(mockPatchChain(new Promise(() => undefined)))

      await user.type(field('title'), 'Hero image')
      await user.click(saveButton())

      expect(field('title')).toBeDisabled()
      expect(saveButton()).toBeDisabled()
      expect(dialog().getByRole('button', {name: /^delete$/i})).toBeDisabled()
    })
  })

  describe('tags', () => {
    const product = tag('t1', 'product')
    const sale = tag('t2', 'sale')
    const tagsInput = () =>
      getDialogRoot(dialogName, screen).querySelector<HTMLInputElement>('#react-select-tags-input')!

    it('shows the tags of the asset once tags are loaded', async () => {
      await renderAssetDialog(
        imageAsset('a1', {opt: {media: {tags: [tagReference('t1'), tagReference('deleted')]}}}),
        {tags: [product, sale]},
      )

      expect(dialog().getByText('product')).toBeInTheDocument()
      expect(dialog().queryByText('sale')).not.toBeInTheDocument()
    })

    it('creates tags inline, and selects them', async () => {
      const user = userEvent.setup()
      const {actors, client} = await renderAssetDialog(photo, {tags: [product]})
      client.create.mockImplementation((document: {name: {current: string}}) =>
        Promise.resolve(tag('t-new', document.name.current)),
      )

      await user.type(tagsInput(), 'fresh{Enter}')

      await waitFor(() => expect(dialog().getByText('fresh')).toBeInTheDocument())
      expect(actors.tags.getSnapshot().context.allIds).toEqual(['t-new', 't1'])
      await waitFor(() => expect(saveButton()).toBeEnabled())
    })
  })

  describe('folders', () => {
    const folders = [
      {_id: 'folder.parent', name: 'Parent', parentId: null},
      {_id: 'folder.section', name: 'Section', parentId: 'folder.parent'},
      {_id: 'folder.nested', name: 'Nested', parentId: 'folder.section'},
      {_id: 'folder.products', name: 'Products', parentId: 'folder.nested'},
    ]

    it('shows the folder path, and moves the asset to another folder', async () => {
      const user = userEvent.setup()
      const {actors} = await renderAssetDialog(inProducts, {folders})
      expect(dialog().getByText('Parent/.../Nested/Products')).toBeInTheDocument()

      await user.click(dialog().getByRole('button', {name: /change folder/i}))

      expect(actors.dialogs.getSnapshot().context.items).toContainEqual(
        folderMoveDialog([assetItem(inProducts)], 'folder.products'),
      )
    })

    it('removes the asset from its folder', async () => {
      const user = userEvent.setup()
      const {client} = await renderAssetDialog(inProducts, {folders})
      const transaction = mockTransaction()
      client.transaction.mockReturnValue(transaction)

      await user.click(dialog().getByRole('button', {name: /remove from folder/i}))

      await waitFor(() => expect(transaction.commit).toHaveBeenCalled())
      expect(transaction.patchChain.unset).toHaveBeenCalledWith(['opt.media.folder'])
    })

    it('tells when the folder no longer exists', async () => {
      await renderAssetDialog(inProducts)

      expect(dialog().getByText('Folder no longer exists')).toBeInTheDocument()
    })
  })

  describe('changes made elsewhere', () => {
    it('follows them, keeping unsaved edits', async () => {
      const user = userEvent.setup()
      const {actors, client} = await renderAssetDialog()
      await user.type(field('title'), 'Mine')

      client.fetch.mockImplementation(
        createMediaFetchMock({assets: [imageAsset('a1', {altText: 'Theirs', title: 'Theirs'})]}),
      )
      act(() => actors.assets.send({type: 'load'}))

      await waitFor(() => expect(field('altText')).toHaveValue('Theirs'))
      expect(field('title')).toHaveValue('Mine')
    })

    it('keeps showing the asset, read-only, once it is deleted', async () => {
      const {client} = await renderAssetDialog()
      const assetListener = client.listen.mock.results.find((_, index) =>
        String(client.listen.mock.calls[index]?.[0]).includes('sanity.imageAsset'),
      )?.value as Subject<unknown>

      vi.useFakeTimers({toFake: ['setTimeout', 'clearTimeout']})
      try {
        act(() => assetListener.next({documentId: 'a1', transition: 'disappear'}))
        act(() => {
          vi.advanceTimersByTime(2000)
        })
      } finally {
        vi.useRealTimers()
      }

      expect(
        dialog().getByText('This file cannot be found – it may have been deleted.'),
      ).toBeInTheDocument()
      expect(field('originalFilename')).toHaveValue('a1.png')
      expect(field('originalFilename')).toBeDisabled()
    })
  })

  describe('closing', () => {
    it('only closes its own dialog', async () => {
      const user = userEvent.setup()
      const {actors} = await renderDialog(tagsDialog(), {assets: [photo]})
      act(() => actors.dialogs.send({type: 'dialog.open', dialog: assetEditDialog('a1')}))

      await user.click(dialog().getByRole('button', {name: /close dialog/i}))

      expect(actors.dialogs.getSnapshot().context.items).toEqual([tagsDialog()])
    })

    it('confirms before deleting the asset, then closes', async () => {
      const user = userEvent.setup()
      const {actors, client} = await renderAssetDialog()

      await user.click(dialog().getByRole('button', {name: /^delete$/i}))
      expect(actors.dialogs.getSnapshot().context.items).toEqual([
        assetEditDialog('a1'),
        confirmDeleteAssetsDialog([assetItem(photo)], 'a1'),
      ])
      await user.click(
        withinDialog(/confirm deletion/i, screen).getByRole('button', {
          name: 'Yes, delete 1 asset',
        }),
      )

      expect(actors.dialogs.getSnapshot().context.items).toEqual([])
      await waitFor(() => expect(client.delete).toHaveBeenCalled())
    })
  })

  describe('description', () => {
    it('is prefilled from the EXIF image description when missing', async () => {
      await renderAssetDialog(
        imageAsset('a1', {metadata: withImageDescription('EXIF description')}),
      )

      expect(textarea('description')).toHaveValue('EXIF description')
    })

    it('keeps an existing description over the EXIF image description', async () => {
      await renderAssetDialog(
        imageAsset('a1', {
          description: 'Written by an editor',
          metadata: withImageDescription('EXIF description'),
        }),
      )

      expect(textarea('description')).toHaveValue('Written by an editor')
    })

    it('stays empty once cleared on purpose', async () => {
      await renderAssetDialog(
        imageAsset('a1', {description: '', metadata: withImageDescription('EXIF description')}),
      )

      expect(textarea('description')).toHaveValue('')
    })

    it('is saved as an empty string when cleared, so EXIF cannot fill it again', async () => {
      const user = userEvent.setup()
      const {client} = await renderAssetDialog(
        imageAsset('a1', {metadata: withImageDescription('EXIF description')}),
      )
      const patch = mockPatchChain(photo)
      client.patch.mockReturnValue(patch)

      await user.clear(textarea('description'))
      await user.click(saveButton())

      await waitFor(() => expect(patch.set).toHaveBeenCalled())
      expect(patch.set.mock.lastCall?.[0]).toMatchObject({description: ''})
    })

    describe('with locales', () => {
      const locales = [
        {id: 'en', title: 'English'},
        {id: 'fr', title: 'French'},
      ]

      it('keeps intentionally empty translations', async () => {
        const user = userEvent.setup()
        await renderAssetDialog(
          imageAsset('a1', {
            description: {en: '', fr: ''},
            metadata: withImageDescription('EXIF description'),
          }),
          {toolOptions: {locales}},
        )

        expect(textarea('description.en')).toHaveValue('')
        await user.click(dialog().getByRole('tab', {name: 'French'}))
        expect(textarea('description.fr')).toHaveValue('')
      })

      it('does not fill missing translations from EXIF', async () => {
        const user = userEvent.setup()
        await renderAssetDialog(
          imageAsset('a1', {
            description: {fr: 'Description française'},
            metadata: withImageDescription('EXIF description'),
          }),
          {toolOptions: {locales}},
        )

        expect(textarea('description.en')).toHaveValue('')
        await user.click(dialog().getByRole('tab', {name: 'French'}))
        expect(textarea('description.fr')).toHaveValue('Description française')
      })
    })
  })

  describe('credit line', () => {
    it('can be edited when credit lines are enabled', async () => {
      await renderAssetDialog()

      expect(field('creditLine')).toBeEnabled()
    })

    it('cannot be edited for assets from excluded sources', async () => {
      await renderAssetDialog(
        imageAsset('a1', {source: {id: 'u1', name: 'unsplash'}} as Partial<ImageAsset>),
        {toolOptions: {creditLine: {enabled: true, excludeSources: ['unsplash']}}},
      )

      expect(field('creditLine')).toBeDisabled()
    })
  })
})
