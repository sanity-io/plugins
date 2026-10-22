import {act, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it} from 'vitest'

import {assetItem, imageAsset, tag} from '../../__tests__/fixtures/documents'
import {deferred, mockTransaction} from '../../__tests__/fixtures/mockSanityClient'
import {renderDialog} from '../../__tests__/fixtures/renderWithMedia'
import {withinDialog} from '../../__tests__/fixtures/withinDialog'
import {confirmAddTagDialog, confirmDeleteAssetsDialog, tagsDialog} from '../../machines/dialogs'

const photo = imageAsset('a1')
const product = tag('t1', 'product')

describe('DialogConfirm', () => {
  it('deletes the assets once confirmed, closing the dialog it was opened from', async () => {
    const user = userEvent.setup()
    const {actors, client} = await renderDialog(tagsDialog(), {assets: [photo]})
    act(() =>
      actors.dialogs.send({
        type: 'dialog.open',
        dialog: confirmDeleteAssetsDialog([assetItem(photo)], 'tags'),
      }),
    )
    const dialog = withinDialog(/confirm deletion/i, screen)
    expect(dialog.getByText('Permanently delete 1 asset?')).toBeInTheDocument()

    await user.click(dialog.getByRole('button', {name: 'Yes, delete 1 asset'}))

    expect(actors.dialogs.getSnapshot().context.items).toEqual([])
    expect(client.delete).toHaveBeenCalledWith({
      params: {assetIds: ['a1']},
      query: '*[_id in $assetIds]',
    })
    expect(await screen.findByText('1 asset deleted')).toBeInTheDocument()
  })

  it('adds the tag once confirmed, showing the tag as busy meanwhile', async () => {
    const user = userEvent.setup()
    const {actors, client} = await renderDialog(confirmAddTagDialog([assetItem(photo)], product), {
      assets: [photo],
      tags: [product],
    })
    const transaction = mockTransaction()
    const commit = deferred()
    transaction.commit.mockReturnValue(commit.promise)
    client.transaction.mockReturnValue(transaction)

    await user.click(screen.getByRole('button', {name: 'Yes, add tag to 1 asset'}))

    expect(actors.tags.getSnapshot().context.byIds['t1']?.updating).toBe(true)
    expect(transaction.patch).toHaveBeenCalledWith('a1', expect.any(Function))
    commit.resolve()
    expect(await screen.findByText('Tag added to 1 asset')).toBeInTheDocument()
    await waitFor(() => expect(actors.tags.getSnapshot().context.byIds['t1']?.updating).toBe(false))
  })

  it('only closes itself when cancelled', async () => {
    const user = userEvent.setup()
    const {actors, client} = await renderDialog(tagsDialog(), {assets: [photo]})
    act(() =>
      actors.dialogs.send({
        type: 'dialog.open',
        dialog: confirmDeleteAssetsDialog([assetItem(photo)]),
      }),
    )

    await user.click(
      withinDialog(/confirm deletion/i, screen).getByRole('button', {name: 'Cancel'}),
    )

    expect(actors.dialogs.getSnapshot().context.items).toEqual([tagsDialog()])
    expect(client.delete).not.toHaveBeenCalled()
  })
})
