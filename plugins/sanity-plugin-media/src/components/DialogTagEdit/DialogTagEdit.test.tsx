import {act, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it} from 'vitest'

import {tag} from '../../__tests__/fixtures/documents'
import {createMediaFetchMock} from '../../__tests__/fixtures/mediaFetchMock'
import {mockPatchChain, mockTransaction} from '../../__tests__/fixtures/mockSanityClient'
import {renderDialog} from '../../__tests__/fixtures/renderWithMedia'
import {getDialogRoot, inputByName, withinDialog} from '../../__tests__/fixtures/withinDialog'
import {confirmDeleteTagDialog, tagEditDialog, tagsDialog} from '../../machines/dialogs'

const alpha = tag('t1', 'alpha')
const dialogName = /edit tag/i

const nameInput = () => inputByName(dialogName, screen, 'name')
const saveButton = () =>
  withinDialog(dialogName, screen).getByRole('button', {name: /save and close/i})
const errorIcon = () =>
  getDialogRoot(dialogName, screen).querySelector('[data-sanity-icon="error-outline"]')

describe('DialogTagEdit', () => {
  it('renames the tag, then closes only its own dialog', async () => {
    const user = userEvent.setup()
    const {actors, client} = await renderDialog(tagsDialog(), {tags: [alpha]})
    act(() => actors.dialogs.send({type: 'dialog.open', dialog: tagEditDialog('t1')}))
    const patch = mockPatchChain(tag('t1', 'beta'))
    client.patch.mockReturnValue(patch)

    await user.clear(nameInput())
    await user.type(nameInput(), 'beta')
    await user.click(saveButton())

    await waitFor(() => expect(actors.dialogs.getSnapshot().context.items).toEqual([tagsDialog()]))
    expect(client.patch).toHaveBeenCalledWith('t1')
    expect(patch.set).toHaveBeenCalledWith({name: {_type: 'slug', current: 'beta'}})
    expect(actors.tags.getSnapshot().context.byIds['t1']?.tag.name.current).toBe('beta')
    expect(await screen.findByText('Tag updated')).toBeInTheDocument()
  })

  it('keeps Save disabled until the name is edited', async () => {
    await renderDialog(tagEditDialog('t1'), {tags: [alpha]})

    expect(nameInput()).toHaveValue('alpha')
    expect(saveButton()).toBeDisabled()
  })

  it('follows changes made to the tag elsewhere', async () => {
    const {actors, client} = await renderDialog(tagEditDialog('t1'), {tags: [alpha]})
    client.fetch.mockImplementation(createMediaFetchMock({tags: [tag('t1', 'renamed')]}))

    act(() => actors.tags.send({type: 'fetch'}))

    await waitFor(() => expect(nameInput()).toHaveValue('renamed'))
  })

  it('keeps showing the tag, read-only, once it is deleted elsewhere', async () => {
    const {actors, client} = await renderDialog(tagEditDialog('t1'), {tags: [alpha]})
    client.fetch.mockImplementation(createMediaFetchMock({tags: []}))

    act(() => actors.tags.send({type: 'fetch'}))

    expect(
      await screen.findByText('This tag cannot be found – it may have been deleted.'),
    ).toBeInTheDocument()
    expect(nameInput()).toHaveValue('alpha')
    expect(nameInput()).toBeDisabled()
    expect(withinDialog(dialogName, screen).getByRole('button', {name: /^delete$/i})).toBeDisabled()
  })

  it('shows why the tag could not be renamed, until the dialog opens again', async () => {
    const user = userEvent.setup()
    const {actors, client} = await renderDialog(tagEditDialog('t1'), {tags: [alpha]})
    const patch = mockPatchChain()
    patch.commit.mockRejectedValue({message: 'Revision mismatch', statusCode: 409})
    client.patch.mockReturnValue(patch)

    await user.clear(nameInput())
    await user.type(nameInput(), 'beta')
    await user.click(saveButton())

    await waitFor(() => expect(errorIcon()).toBeInTheDocument())
    expect(await screen.findByText('An error occurred: Revision mismatch')).toBeInTheDocument()

    act(() => actors.dialogs.send({type: 'dialog.close', id: 't1'}))
    act(() => actors.dialogs.send({type: 'dialog.open', dialog: tagEditDialog('t1')}))
    expect(errorIcon()).not.toBeInTheDocument()
  })

  it('deletes the tag once confirmed, closing its dialog', async () => {
    const user = userEvent.setup()
    const {actors, client} = await renderDialog(tagEditDialog('t1'), {tags: [alpha]})
    const transaction = mockTransaction()
    client.transaction.mockReturnValue(transaction)

    await user.click(withinDialog(dialogName, screen).getByRole('button', {name: /^delete$/i}))
    expect(actors.dialogs.getSnapshot().context.items).toEqual([
      tagEditDialog('t1'),
      confirmDeleteTagDialog(alpha, 't1'),
    ])
    await user.click(
      withinDialog(/confirm deletion/i, screen).getByRole('button', {name: 'Yes, delete tag'}),
    )

    expect(actors.dialogs.getSnapshot().context.items).toEqual([])
    expect(await screen.findByText('Tag deleted')).toBeInTheDocument()
    expect(transaction.delete).toHaveBeenCalledWith('t1')
    expect(actors.tags.getSnapshot().context.allIds).toEqual([])
  })

  it('renders nothing for tags that are not loaded', async () => {
    await renderDialog(tagEditDialog('unknown'), {tags: [alpha]})

    expect(screen.queryByRole('dialog', {name: dialogName})).not.toBeInTheDocument()
  })
})
