import {cleanup, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {afterEach, describe, expect, it} from 'vitest'

import {renderWithProviders} from '../../__tests__/fixtures/renderWithProviders'
import {getDialogRoot, inputByName, withinDialog} from '../../__tests__/fixtures/withinDialog'
import DialogFolderCreate from './index'

describe('DialogFolderCreate', () => {
  afterEach(() => {
    cleanup()
  })

  it('dispatches folder createRequest with the entered name', async () => {
    const user = userEvent.setup()
    const {store} = renderWithProviders(
      <DialogFolderCreate dialog={{id: 'dlg-1', type: 'folderCreate', parentFolderId: null}}>
        <span />
      </DialogFolderCreate>,
    )

    const dlg = withinDialog(/create folder/i, screen)
    await user.type(inputByName(/create folder/i, screen, 'name'), 'Campaigns')
    await user.click(dlg.getByRole('button', {name: /save and close/i}))

    await waitFor(() => {
      expect(store.getState().folders.creating).toBe(true)
    })
  })

  it('keeps Save disabled until the name is valid', async () => {
    renderWithProviders(
      <DialogFolderCreate dialog={{id: 'dlg-1', type: 'folderCreate', parentFolderId: null}}>
        <span />
      </DialogFolderCreate>,
    )

    expect(
      withinDialog(/create folder/i, screen).getByRole('button', {name: /save and close/i}),
    ).toBeDisabled()
  })

  it('shows an error indicator and keeps Save disabled for a whitespace-only name', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <DialogFolderCreate dialog={{id: 'dlg-1', type: 'folderCreate', parentFolderId: null}}>
        <span />
      </DialogFolderCreate>,
    )

    await user.type(inputByName(/create folder/i, screen, 'name'), '   ')

    await waitFor(() => {
      expect(
        getDialogRoot(/create folder/i, screen).querySelector('[data-sanity-icon="error-outline"]'),
      ).toBeTruthy()
    })
    expect(
      withinDialog(/create folder/i, screen).getByRole('button', {name: /save and close/i}),
    ).toBeDisabled()
  })
})
