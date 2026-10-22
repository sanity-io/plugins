import {screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it} from 'vitest'

import {assetItem, folderReference, imageAsset} from '../../__tests__/fixtures/documents'
import {createMediaFetchMock, type MediaFixtures} from '../../__tests__/fixtures/mediaFetchMock'
import {mockTransaction} from '../../__tests__/fixtures/mockSanityClient'
import {renderDialog} from '../../__tests__/fixtures/renderWithMedia'
import {withinDialog} from '../../__tests__/fixtures/withinDialog'
import {folderMoveDialog} from '../../machines/dialogs'

const photo = imageAsset('a1')
const folders = [{_id: 'f1', name: 'Campaigns', parentId: null}]

const dialog = () => withinDialog(/move to folder/i, screen)
const moveButton = () => dialog().getByRole('button', {name: 'Move 1 asset'})

const renderMoveDialog = (fixtures: MediaFixtures = {}) =>
  renderDialog(folderMoveDialog([assetItem(photo)], null), {assets: [photo], ...fixtures})

describe('DialogFolderMove', () => {
  it('moves the assets to the picked folder, then closes', async () => {
    const user = userEvent.setup()
    const {client} = await renderMoveDialog({folders})
    const transaction = mockTransaction()
    client.transaction.mockReturnValue(transaction)
    expect(moveButton()).toBeDisabled()

    await user.click(dialog().getByText('Campaigns (0)'))
    await user.click(moveButton())

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(transaction.patchChain.set).toHaveBeenCalledWith({
      'opt.media.folder': folderReference('f1'),
    })
  })

  it('stays open, and tells why, when the assets could not be moved', async () => {
    const user = userEvent.setup()
    const {client} = await renderMoveDialog({folders})
    const transaction = mockTransaction()
    transaction.commit.mockRejectedValue({message: 'Forbidden', statusCode: 403})
    client.transaction.mockReturnValue(transaction)

    await user.click(dialog().getByText('Campaigns (0)'))
    await user.click(moveButton())

    expect(await screen.findByText('An error occurred: Forbidden')).toBeInTheDocument()
    expect(moveButton()).toBeEnabled()
  })

  it('tells while folders load', async () => {
    await renderMoveDialog({pending: ['folders']})

    expect(dialog().getByText('Loading folders...')).toBeInTheDocument()
  })

  it('tells when there are no folders yet', async () => {
    await renderMoveDialog()

    expect(dialog().getByText('No folders yet.')).toBeInTheDocument()
  })

  it('offers to load folders again when they failed to load', async () => {
    const user = userEvent.setup()
    const {client} = await renderMoveDialog({
      errors: {folders: {message: 'Query timed out', statusCode: 504}},
    })
    expect(dialog().getByText('Unable to load folders')).toBeInTheDocument()
    expect(dialog().queryByText('No folders yet.')).not.toBeInTheDocument()
    client.fetch.mockImplementation(createMediaFetchMock({assets: [photo], folders}))

    await user.click(dialog().getByRole('button', {name: 'Retry'}))

    expect(await dialog().findByText('Campaigns (0)')).toBeInTheDocument()
    expect(dialog().queryByText('Unable to load folders')).not.toBeInTheDocument()
  })
})
