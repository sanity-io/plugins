import {fireEvent, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {Subject} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import DialogAssetEdit from './index'

vi.mock('../Image', () => ({default: () => null}))
vi.mock('../FileAssetPreview', () => ({default: () => null}))
vi.mock('../DocumentList', () => ({default: () => null}))
vi.mock('../AssetMetadata', () => ({default: () => null}))
import {createMockSanityClient} from '../../__tests__/fixtures/mockSanityClient'
import {renderWithProviders} from '../../__tests__/fixtures/renderWithProviders'
import {createTestRootState} from '../../__tests__/fixtures/rootState'
import {getDialogRoot, inputByName, withinDialog} from '../../__tests__/fixtures/withinDialog'
import {assetsActions, initialState as assetsInitialState} from '../../modules/assets'
import type {RootReducerState} from '../../modules/types'
import type {AssetType, ImageAsset, MediaToolOptions} from '../../types'

const asset = {
  _id: 'a1',
  _type: 'sanity.imageAsset',
  _createdAt: '',
  _updatedAt: '',
  _rev: 'r1',
  originalFilename: 'x.png',
  size: 1,
  mimeType: 'image/png',
  url: 'https://example.com/x.png',
  metadata: {dimensions: {width: 100, height: 100}, isOpaque: true},
} as ImageAsset

const assetsPreloaded = {
  ...assetsInitialState,
  assetTypes: ['image'] as AssetType[],
  allIds: ['a1'],
  byIds: {
    a1: {_type: 'asset' as const, asset, picked: false, updating: false},
  },
}

function assetsWith(overrides: Partial<ImageAsset>) {
  const next = {...asset, ...overrides} as ImageAsset
  return {
    ...assetsInitialState,
    assetTypes: ['image'] as AssetType[],
    allIds: ['a1'],
    byIds: {
      a1: {_type: 'asset' as const, asset: next, picked: false, updating: false},
    },
  }
}

function withImageDescription(description: string): ImageAsset['metadata'] {
  return {
    ...asset.metadata,
    image: {
      _type: 'sanity.imageExifTags',
      ImageDescription: description,
    },
  }
}

function textareaByName(
  dialogName: RegExp,
  base: typeof screen,
  name: string,
): HTMLTextAreaElement {
  const root = getDialogRoot(dialogName, base)
  const el = root.querySelector(`textarea[name="${name}"]`)
  if (!el || !(el instanceof HTMLTextAreaElement)) {
    throw new Error(`No textarea name="${name}" in dialog matching ${dialogName}`)
  }
  return el
}

vi.mock('sanity', async (importOriginal) => {
  const actual = await importOriginal<typeof import('sanity')>()
  return {
    ...actual,
    WithReferringDocuments: ({children}: {children: (args: unknown) => unknown}) =>
      children({isLoading: false, referringDocuments: []}),
    useDocumentStore: () => ({}),
  }
})

vi.mock('../../hooks/useVersionedClient', () => ({
  default: () =>
    createMockSanityClient({
      listen: vi.fn(() => new Subject()),
    }),
}))

function renderAssetDialog(
  dialog: {id: string; type: 'assetEdit'; assetId: string},
  opts: {
    preloaded?: Partial<RootReducerState>
    toolOptions?: Partial<MediaToolOptions>
  } = {},
) {
  const {preloaded: extraPreloaded, toolOptions} = opts
  return renderWithProviders(
    <DialogAssetEdit dialog={dialog}>
      <span />
    </DialogAssetEdit>,
    {
      preloaded: {
        assets: assetsPreloaded,
        ...extraPreloaded,
      },
      toolOptions: {creditLine: {enabled: true}, ...toolOptions},
    },
  )
}

describe('DialogAssetEdit', () => {
  it('renders asset details header and details tab', () => {
    renderAssetDialog({
      id: 'dlg-1',
      type: 'assetEdit',
      assetId: 'a1',
    })

    const dlg = withinDialog(/asset details/i, screen)
    expect(dlg.getByText('Asset details')).toBeInTheDocument()
    expect(dlg.getByRole('tab', {name: 'Details'})).toBeInTheDocument()
  })

  it('keeps Save disabled until a field is edited', () => {
    renderAssetDialog({
      id: 'dlg-1',
      type: 'assetEdit',
      assetId: 'a1',
    })

    const dlg = withinDialog(/asset details/i, screen)
    expect(dlg.getByRole('button', {name: /save and close/i})).toBeDisabled()
  })

  it('dispatches asset update when a field changes and the form is submitted', async () => {
    const user = userEvent.setup()
    const {store} = renderAssetDialog({
      id: 'dlg-1',
      type: 'assetEdit',
      assetId: 'a1',
    })
    const dispatchSpy = vi.spyOn(store, 'dispatch')
    const dlg = withinDialog(/asset details/i, screen)

    await user.type(inputByName(/asset details/i, screen, 'title'), 'Hero image')
    await user.click(dlg.getByRole('button', {name: /save and close/i}))

    expect(store.getState().assets.byIds['a1']!.updating).toBe(true)

    await waitFor(() => {
      let updateAction
      for (const call of dispatchSpy.mock.calls) {
        const action = call[0]
        if (assetsActions.updateRequest.match(action)) {
          updateAction = action
          break
        }
      }
      expect(updateAction).toBeDefined()
      expect(updateAction?.payload).toMatchObject({
        asset,
        closeDialogId: 'a1',
        formData: expect.objectContaining({
          title: 'Hero image',
          originalFilename: 'x.png',
        }),
      })
    })
  })

  it('removes only this dialog when closed', async () => {
    const user = userEvent.setup()
    const base = createTestRootState({
      dialog: {
        items: [
          {id: 'dlg-1', type: 'assetEdit', assetId: 'a1'},
          {id: 'tags', type: 'tags'},
        ],
      },
      assets: assetsPreloaded,
    })

    const {store} = renderWithProviders(
      <DialogAssetEdit
        dialog={{
          id: 'dlg-1',
          type: 'assetEdit',
          assetId: 'a1',
        }}
      >
        <span />
      </DialogAssetEdit>,
      {
        preloaded: base,
        toolOptions: {creditLine: {enabled: true}},
      },
    )

    const dlg = withinDialog(/asset details/i, screen)
    await user.click(dlg.getByRole('button', {name: /close dialog/i}))

    expect(store.getState().dialog.items).toEqual([{id: 'tags', type: 'tags'}])
  })

  it('opens the delete confirmation dialog when Delete is clicked', async () => {
    const {store} = renderAssetDialog({
      id: 'dlg-1',
      type: 'assetEdit',
      assetId: 'a1',
    })

    const dlg = withinDialog(/asset details/i, screen)
    fireEvent.click(dlg.getByRole('button', {name: /^delete$/i}))

    await waitFor(() => {
      let confirm
      for (const d of store.getState().dialog.items) {
        if (d.type === 'confirm') {
          confirm = d
          break
        }
      }
      expect(confirm).toBeDefined()
      expect(confirm?.title).toMatch(/permanently delete/i)
      expect(confirm?.headerTitle).toBe('Confirm deletion')
    })
  })

  it('shows the current folder path and opens folder move dialog', async () => {
    const user = userEvent.setup()
    const assetInFolder = {
      ...asset,
      opt: {media: {folder: {_ref: 'folder.products', _type: 'reference' as const, _weak: true}}},
    } as ImageAsset
    const {store} = renderAssetDialog(
      {
        id: 'dlg-1',
        type: 'assetEdit',
        assetId: 'a1',
      },
      {
        preloaded: {
          assets: {
            ...assetsPreloaded,
            byIds: {
              a1: {_type: 'asset', asset: assetInFolder, picked: false, updating: false},
            },
          },
          folders: {
            byId: {
              'folder.parent': {_id: 'folder.parent', name: 'Parent', parentId: null},
              'folder.section': {_id: 'folder.section', name: 'Section', parentId: 'folder.parent'},
              'folder.nested': {_id: 'folder.nested', name: 'Nested', parentId: 'folder.section'},
              'folder.products': {
                _id: 'folder.products',
                name: 'Products',
                parentId: 'folder.nested',
              },
            },
            childrenByParentId: {
              'folder.parent': ['folder.section'],
              'folder.section': ['folder.nested'],
              'folder.nested': ['folder.products'],
            },
            rootIds: ['folder.parent'],
            exactCountByFolderId: {},
            unfiledCount: 0,
            currentFolderId: null,
            currentFolderUnfiled: false,
            panelVisible: false,
            fetching: false,
            fetchCount: -1,
            creating: false,
            renaming: false,
          },
        },
      },
    )

    const dlg = withinDialog(/asset details/i, screen)
    expect(dlg.getByText('Parent/.../Nested/Products')).toBeInTheDocument()

    await user.click(dlg.getByRole('button', {name: /change folder/i}))

    const moveDialog = store.getState().dialog.items.find((item) => item.type === 'folderMove')
    expect(moveDialog).toMatchObject({
      assets: [store.getState().assets.byIds['a1']],
      folderId: 'folder.products',
      id: 'folderMove',
      type: 'folderMove',
    })
  })

  it('removes the current folder from the details view', async () => {
    const user = userEvent.setup()
    const assetInFolder = {
      ...asset,
      opt: {media: {folder: {_ref: 'folder.products', _type: 'reference' as const, _weak: true}}},
    } as ImageAsset
    const {store} = renderAssetDialog(
      {
        id: 'dlg-1',
        type: 'assetEdit',
        assetId: 'a1',
      },
      {
        preloaded: {
          assets: {
            ...assetsPreloaded,
            byIds: {
              a1: {_type: 'asset', asset: assetInFolder, picked: false, updating: false},
            },
          },
        },
      },
    )

    const dlg = withinDialog(/asset details/i, screen)
    await user.click(dlg.getByRole('button', {name: /remove from folder/i}))

    expect(store.getState().assets.byIds['a1']?.updating).toBe(true)
  })

  it('switches to the References tab when that tab is activated', async () => {
    const user = userEvent.setup()
    renderAssetDialog({
      id: 'dlg-1',
      type: 'assetEdit',
      assetId: 'a1',
    })

    const dlg = withinDialog(/asset details/i, screen)
    const referencesTab = dlg.getByRole('tab', {name: /references/i})
    expect(referencesTab).toHaveAttribute('aria-selected', 'false')

    await user.click(referencesTab)

    expect(referencesTab).toHaveAttribute('aria-selected', 'true')
    expect(dlg.getByRole('tab', {name: 'Details'})).toHaveAttribute('aria-selected', 'false')
  })

  it('prefills Description from EXIF ImageDescription when description is missing', async () => {
    renderAssetDialog(
      {
        id: 'dlg-1',
        type: 'assetEdit',
        assetId: 'a1',
      },
      {
        preloaded: {
          assets: assetsWith({
            description: undefined,
            metadata: withImageDescription('EXIF ImageDescription test'),
          }),
        },
      },
    )

    await waitFor(() => {
      expect(textareaByName(/asset details/i, screen, 'description')).toHaveValue(
        'EXIF ImageDescription test',
      )
    })
  })

  it('does not override an existing Description with EXIF ImageDescription', async () => {
    renderAssetDialog(
      {
        id: 'dlg-1',
        type: 'assetEdit',
        assetId: 'a1',
      },
      {
        preloaded: {
          assets: assetsWith({
            description: 'Already set by editor',
            metadata: withImageDescription('EXIF ImageDescription test'),
          }),
        },
      },
    )

    await waitFor(() => {
      expect(textareaByName(/asset details/i, screen, 'description')).toHaveValue(
        'Already set by editor',
      )
    })
  })

  it('does not refill Description from EXIF when it was intentionally cleared', async () => {
    renderAssetDialog(
      {
        id: 'dlg-1',
        type: 'assetEdit',
        assetId: 'a1',
      },
      {
        preloaded: {
          assets: assetsWith({
            description: '',
            metadata: withImageDescription('EXIF ImageDescription test'),
          }),
        },
      },
    )

    await waitFor(() => {
      expect(textareaByName(/asset details/i, screen, 'description')).toHaveValue('')
    })
  })

  it('persists a cleared Description as empty string so EXIF cannot refill it', async () => {
    const user = userEvent.setup()
    const {store} = renderAssetDialog(
      {
        id: 'dlg-1',
        type: 'assetEdit',
        assetId: 'a1',
      },
      {
        preloaded: {
          assets: assetsWith({
            description: undefined,
            metadata: withImageDescription('EXIF ImageDescription test'),
          }),
        },
      },
    )
    const dispatchSpy = vi.spyOn(store, 'dispatch')
    const dlg = withinDialog(/asset details/i, screen)

    await waitFor(() => {
      expect(textareaByName(/asset details/i, screen, 'description')).toHaveValue(
        'EXIF ImageDescription test',
      )
    })

    await user.clear(textareaByName(/asset details/i, screen, 'description'))
    await user.click(dlg.getByRole('button', {name: /save and close/i}))

    await waitFor(() => {
      let updateAction
      for (const call of dispatchSpy.mock.calls) {
        const action = call[0]
        if (assetsActions.updateRequest.match(action)) {
          updateAction = action
          break
        }
      }
      expect(updateAction).toBeDefined()
      expect(updateAction?.payload.formData).toMatchObject({
        description: '',
      })
    })
  })

  it('preserves intentionally empty localized description instead of applying EXIF fallback', async () => {
    const user = userEvent.setup()
    renderAssetDialog(
      {
        id: 'dlg-1',
        type: 'assetEdit',
        assetId: 'a1',
      },
      {
        preloaded: {
          assets: assetsWith({
            description: {en: '', fr: ''},
            metadata: withImageDescription('EXIF ImageDescription test'),
          }),
        },
        toolOptions: {
          locales: [
            {id: 'en', title: 'English'},
            {id: 'fr', title: 'French'},
          ],
        },
      },
    )

    await waitFor(() => {
      expect(textareaByName(/asset details/i, screen, 'description.en')).toHaveValue('')
    })

    const dlg = withinDialog(/asset details/i, screen)
    await user.click(dlg.getByRole('tab', {name: 'French'}))
    expect(textareaByName(/asset details/i, screen, 'description.fr')).toHaveValue('')
  })

  it('does not fill missing locale keys from EXIF when a partial translation exists', async () => {
    renderAssetDialog(
      {
        id: 'dlg-1',
        type: 'assetEdit',
        assetId: 'a1',
      },
      {
        preloaded: {
          assets: assetsWith({
            description: {fr: 'Description française'},
            metadata: withImageDescription('EXIF ImageDescription test'),
          }),
        },
        toolOptions: {
          locales: [
            {id: 'en', title: 'English'},
            {id: 'fr', title: 'French'},
          ],
        },
      },
    )

    await waitFor(() => {
      expect(textareaByName(/asset details/i, screen, 'description.en')).toHaveValue('')
    })

    const dlg = withinDialog(/asset details/i, screen)
    const user = userEvent.setup()
    await user.click(dlg.getByRole('tab', {name: 'French'}))
    expect(textareaByName(/asset details/i, screen, 'description.fr')).toHaveValue(
      'Description française',
    )
  })
})
