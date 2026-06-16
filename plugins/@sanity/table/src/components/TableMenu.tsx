import {AddIcon, ControlsIcon, WarningOutlineIcon} from '@sanity/icons'
import {
  Box,
  Button,
  Card,
  Dialog,
  Inline,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  type Placement,
  TextInput,
} from '@sanity/ui'
import {type ChangeEventHandler, useState} from 'react'

interface TableMenuProps {
  id: string
  addColumns: (count: number) => void
  addColumnAt: (index: number) => void
  addRows: (count: number) => void
  addRowAt: (index: number) => void
  remove: () => void
  placement: Placement
}

export const TableMenu = (props: TableMenuProps): React.JSX.Element => {
  const {id, remove: handleRemove} = props
  const [dialog, setDialog] = useState<{
    type: string
    callback: (count: number) => void
  } | null>(null)

  // Keep `count` always a string so the TextInput is controlled for the component lifetime.
  const [count, setCount] = useState<string>('')

  const updateCount: ChangeEventHandler<HTMLInputElement> = (e) => {
    setCount(e.currentTarget.value)
  }

  const addRows = () => {
    setDialog({type: 'rows', callback: (c) => props.addRows(c)})
    setCount('') // ensure input starts controlled when dialog opens
  }

  const addRowAt = () => {
    setDialog({type: 'rows', callback: (index) => props.addRowAt(index)})
    setCount('')
  }

  const addColumns = () => {
    setDialog({
      type: 'columns',
      callback: (c) => props.addColumns(c),
    })
    setCount('')
  }

  const addColumnsAt = () => {
    setDialog({type: 'columns', callback: (index) => props.addColumnAt(index)})
    setCount('')
  }

  // The dialog is reused for "add N rows/columns" (a count) and "add at index"
  // (a position where 0 is valid), so allow 0 but reject NaN/negative/too-large.
  const parsedCount = Number.parseInt(count, 10)
  const isValidCount = Number.isInteger(parsedCount) && parsedCount >= 0 && parsedCount < 100

  const onConfirm = () => {
    if (!isValidCount) {
      return
    }
    setDialog(null)
    dialog?.callback(parsedCount)
    setCount('')
  }

  return (
    <>
      {dialog && (
        <Dialog
          header={`Add ${dialog.type}`}
          id={`${id}-dialog-add`}
          onClose={() => {
            setDialog(null)
            setCount('')
          }}
          zOffset={1000}
        >
          <Card padding={4}>
            <TextInput
              style={{textAlign: 'left'}}
              fontSize={2}
              padding={3}
              type="number"
              value={count}
              onChange={updateCount}
              customValidity={
                count !== '' && !isValidCount ? 'Enter a whole number from 0 to 99' : undefined
              }
            />
            <Box marginTop={4}>
              <Inline gap={1} style={{textAlign: 'right'}}>
                <Button
                  text="Cancel"
                  mode="ghost"
                  onClick={() => {
                    setDialog(null)
                    setCount('')
                  }}
                />
                <Button
                  text="Confirm"
                  tone="critical"
                  onClick={onConfirm}
                  disabled={!isValidCount}
                />
              </Inline>
            </Box>
          </Card>
        </Dialog>
      )}
      <MenuButton
        button={<Button icon={ControlsIcon} fontSize={1} padding={2} mode="ghost" />}
        id={`${id}-menu-button`}
        menu={
          <Menu>
            <MenuItem icon={AddIcon} fontSize={1} text="Add Row(s)" onClick={addRows} />
            <MenuItem icon={AddIcon} fontSize={1} text="Add Row At Index" onClick={addRowAt} />
            <MenuItem icon={AddIcon} fontSize={1} text="Add Column(s)" onClick={addColumns} />
            <MenuItem
              icon={AddIcon}
              fontSize={1}
              text="Add Column At Index"
              onClick={addColumnsAt}
            />
            <MenuDivider />
            <MenuItem
              icon={WarningOutlineIcon}
              fontSize={1}
              text="Remove"
              tone="critical"
              onClick={handleRemove}
            />
          </Menu>
        }
        popover={{placement: props.placement}}
      />
    </>
  )
}
