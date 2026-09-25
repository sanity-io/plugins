import {act, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it} from 'vitest'

import {tag} from '../../__tests__/fixtures/documents'
import {renderDialog} from '../../__tests__/fixtures/renderWithMedia'
import {getDialogRoot, inputByName, withinDialog} from '../../__tests__/fixtures/withinDialog'
import {tagCreateDialog, tagsDialog} from '../../machines/dialogs'
import {selectTags} from '../../machines/tagsMachine'

const dialogName = /create tag/i

const saveButton = () =>
  withinDialog(dialogName, screen).getByRole('button', {name: /save and close/i})
const errorIcon = () =>
  getDialogRoot(dialogName, screen).querySelector('[data-sanity-icon="error-outline"]')

describe('DialogTagCreate', () => {
  it('creates the tag with a trimmed name, then closes', async () => {
    const user = userEvent.setup()
    const {actors, client} = await renderDialog(tagCreateDialog())
    client.create.mockImplementation((document: {name: {current: string}}) =>
      Promise.resolve({...tag('t1', document.name.current)}),
    )

    await user.type(inputByName(dialogName, screen, 'name'), '  spaced  ')
    await user.click(saveButton())

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(client.create).toHaveBeenCalledWith({
      _type: 'media.tag',
      name: {_type: 'slug', current: 'spaced'},
    })
    expect(selectTags(actors.tags.getSnapshot()).map((item) => item.tag.name.current)).toEqual([
      'spaced',
    ])
    expect(await screen.findByText('Tag created')).toBeInTheDocument()
  })

  it('keeps Save disabled until the name is valid', async () => {
    const user = userEvent.setup()
    await renderDialog(tagCreateDialog())
    expect(saveButton()).toBeDisabled()

    await user.type(inputByName(dialogName, screen, 'name'), 'a')

    await waitFor(() => expect(saveButton()).toBeEnabled())
  })

  it('shows why the tag could not be created, until the dialog opens again', async () => {
    const user = userEvent.setup()
    const {actors, client} = await renderDialog(tagCreateDialog(), {tags: [tag('t1', 'product')]})

    await user.type(inputByName(dialogName, screen, 'name'), 'product')
    await user.click(saveButton())

    await waitFor(() => expect(errorIcon()).toBeInTheDocument())
    expect(client.create).not.toHaveBeenCalled()
    expect(await screen.findByText('An error occurred: Tag already exists')).toBeInTheDocument()

    act(() => actors.dialogs.send({type: 'dialogs.clear'}))
    act(() => actors.dialogs.send({type: 'dialog.open', dialog: tagCreateDialog()}))
    expect(errorIcon()).not.toBeInTheDocument()
  })

  it('closes every open dialog when dismissed', async () => {
    const user = userEvent.setup()
    const {actors} = await renderDialog(tagsDialog())
    act(() => actors.dialogs.send({type: 'dialog.open', dialog: tagCreateDialog()}))

    await user.click(withinDialog(dialogName, screen).getByRole('button', {name: /close dialog/i}))

    expect(actors.dialogs.getSnapshot().context.items).toEqual([])
  })
})
