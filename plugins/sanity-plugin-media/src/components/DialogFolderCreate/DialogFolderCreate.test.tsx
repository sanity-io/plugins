import {act, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it} from 'vitest'

import {renderDialog} from '../../__tests__/fixtures/renderWithMedia'
import {getDialogRoot, inputByName, withinDialog} from '../../__tests__/fixtures/withinDialog'
import {folderCreateDialog, foldersDialog} from '../../machines/dialogs'

const folders = [{_id: 'f1', name: 'Campaigns', parentId: null}]
const dialogName = /create folder/i

const saveButton = () =>
  withinDialog(dialogName, screen).getByRole('button', {name: /save and close/i})
const errorIcon = () =>
  getDialogRoot(dialogName, screen).querySelector('[data-sanity-icon="error-outline"]')

describe('DialogFolderCreate', () => {
  it('creates the folder inside its parent, then opens it', async () => {
    const user = userEvent.setup()
    const {actors, client} = await renderDialog(folderCreateDialog('f1'), {folders})
    expect(
      withinDialog(dialogName, screen).getByText('Creating inside Campaigns'),
    ).toBeInTheDocument()

    await user.type(inputByName(dialogName, screen, 'name'), '  Summer  ')
    await user.click(saveButton())

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(client.create).toHaveBeenCalledWith({
      _id: expect.any(String),
      _type: 'media.folder',
      name: 'Summer',
      parent: {_ref: 'f1', _type: 'reference', _weak: true},
    })
    expect(actors.assets.getSnapshot().context.currentFolderId).toBe(
      client.create.mock.lastCall?.[0]._id,
    )
    expect(await screen.findByText('Folder created')).toBeInTheDocument()
  })

  it('keeps Save disabled until the name is valid', async () => {
    const user = userEvent.setup()
    await renderDialog(folderCreateDialog(null))
    expect(saveButton()).toBeDisabled()

    await user.type(inputByName(dialogName, screen, 'name'), 'Summer')

    await waitFor(() => expect(saveButton()).toBeEnabled())
  })

  it('shows why the folder could not be created, until the dialog opens again', async () => {
    const user = userEvent.setup()
    const {actors, client} = await renderDialog(folderCreateDialog(null), {folders})

    await user.type(inputByName(dialogName, screen, 'name'), 'campaigns')
    await user.click(saveButton())

    await waitFor(() => expect(errorIcon()).toBeInTheDocument())
    expect(client.create).not.toHaveBeenCalled()
    expect(
      await screen.findByText('An error occurred: A folder with this name already exists here'),
    ).toBeInTheDocument()

    act(() => actors.dialogs.send({type: 'dialogs.clear'}))
    act(() => actors.dialogs.send({type: 'dialog.open', dialog: folderCreateDialog(null)}))
    expect(errorIcon()).not.toBeInTheDocument()
  })

  it('stops showing the error once the name is edited', async () => {
    const user = userEvent.setup()
    await renderDialog(folderCreateDialog(null), {folders})
    const input = inputByName(dialogName, screen, 'name')
    await user.type(input, 'campaigns')
    await user.click(saveButton())
    await waitFor(() => expect(errorIcon()).toBeInTheDocument())

    await user.type(input, ' 2025')

    await waitFor(() => expect(errorIcon()).not.toBeInTheDocument())
    expect(saveButton()).toBeEnabled()
  })

  it('closes every open dialog when dismissed', async () => {
    const user = userEvent.setup()
    const {actors} = await renderDialog(foldersDialog())
    act(() => actors.dialogs.send({type: 'dialog.open', dialog: folderCreateDialog(null)}))

    await user.click(withinDialog(dialogName, screen).getByRole('button', {name: /close dialog/i}))

    expect(actors.dialogs.getSnapshot().context.items).toEqual([])
  })
})
