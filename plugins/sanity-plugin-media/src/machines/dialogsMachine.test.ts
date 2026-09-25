// @vitest-environment node
import {describe, expect, it} from 'vitest'
import {createActor} from 'xstate'

import {createTestParent} from '../__tests__/fixtures/testParent'
import {assetEditDialog, foldersDialog, tagsDialog} from './dialogs'
import {dialogsMachine, type DialogsReport} from './dialogsMachine'

function startDialogsActor() {
  const testParent = createTestParent<DialogsReport>()
  const actor = createActor(dialogsMachine, {parent: testParent.parent}).start()
  return {actor, ...testParent}
}

describe(dialogsMachine.id, () => {
  it('stacks opened dialogs and reports each of them', () => {
    const {actor, events} = startDialogsActor()

    actor.send({type: 'dialog.open', dialog: assetEditDialog('a1')})
    actor.send({type: 'dialog.open', dialog: tagsDialog()})

    expect(actor.getSnapshot().context.items).toEqual([assetEditDialog('a1'), tagsDialog()])
    expect(events).toEqual([
      {type: 'dialog.opened', dialog: assetEditDialog('a1')},
      {type: 'dialog.opened', dialog: tagsDialog()},
    ])
  })

  it('does not open the same dialog twice', () => {
    const {actor, events} = startDialogsActor()

    actor.send({type: 'dialog.open', dialog: assetEditDialog('a1')})
    const {items} = actor.getSnapshot().context
    actor.send({type: 'dialog.open', dialog: assetEditDialog('a1')})

    expect(actor.getSnapshot().context.items).toBe(items)
    expect(events).toHaveLength(1)
  })

  it('closes dialogs by id, and reports when none are left', () => {
    const {actor, events} = startDialogsActor()
    actor.send({type: 'dialog.open', dialog: assetEditDialog('a1')})
    actor.send({type: 'dialog.open', dialog: tagsDialog()})
    events.length = 0

    actor.send({type: 'dialog.close', id: 'missing'})
    actor.send({type: 'dialog.close', id: 'a1'})
    expect(actor.getSnapshot().context.items).toEqual([tagsDialog()])

    actor.send({type: 'dialog.close', id: 'tags'})
    expect(events).toEqual([
      {type: 'dialog.closed', dialog: assetEditDialog('a1')},
      {type: 'dialog.closed', dialog: tagsDialog()},
      {type: 'dialogs.emptied'},
    ])
  })

  it('clears every dialog at once', () => {
    const {actor, events} = startDialogsActor()
    actor.send({type: 'dialog.open', dialog: foldersDialog()})
    actor.send({type: 'dialog.open', dialog: tagsDialog()})
    events.length = 0

    actor.send({type: 'dialogs.clear'})
    actor.send({type: 'dialogs.clear'})

    expect(actor.getSnapshot().context.items).toEqual([])
    expect(events).toEqual([
      {type: 'dialog.closed', dialog: foldersDialog()},
      {type: 'dialog.closed', dialog: tagsDialog()},
      {type: 'dialogs.emptied'},
    ])
  })
})
