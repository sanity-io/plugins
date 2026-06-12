import {AddIcon} from '@sanity/icons'
import {Box, Button, Card, Dialog, Flex, Inline, Text} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {type ChangeEvent, useState} from 'react'
import {type ObjectInputProps, set, unset} from 'sanity'

import {TableInput} from './TableInput'
import {TableMenu} from './TableMenu'

const deepClone: <T>(data: T) => T =
  globalThis.structuredClone ?? ((data) => JSON.parse(JSON.stringify(data)))

export interface TableValue {
  _type?: 'table'
  rows?: TableRow[]
}

export type TableProps = ObjectInputProps<TableValue>

export type TableRow = {
  _type: string
  _key: string
  cells: string[]
}

// TODO refactor deeplone stuff to use proper patches
// TODO use callback all the things

export const TableComponent = (props: TableProps & {rowType?: string}) => {
  const {rowType = 'tableRow', value, onChange} = props
  const [dialog, setDialog] = useState<{
    type: string
    callback: () => void
  } | null>(null)

  const updateValue = (v?: Omit<TableValue, '_type'>) => {
    return onChange(set(v))
  }

  const resetValue = () => {
    return onChange(unset())
  }

  const createTable = () => {
    const newValue: Omit<TableValue, '_type'> = {
      rows: [
        {
          _type: rowType,
          _key: uuid(),
          cells: ['', ''],
        },
        {
          _type: rowType,
          _key: uuid(),
          cells: ['', ''],
        },
      ],
    }
    return updateValue({...value, ...newValue})
  }

  const confirmRemoveTable = () => {
    setDialog({type: 'table', callback: removeTable})
  }

  const removeTable = () => {
    resetValue()
    setDialog(null)
  }

  const addRows = (count = 1) => {
    if (!value?.rows) {
      return
    }
    const newRows = deepClone(value.rows)
    // Calculate the column count from the first row
    const columnCount = value.rows[0]?.cells.length ?? 0
    for (let i = 0; i < count; i++) {
      // Add as many cells as we have columns
      newRows.push({
        _type: rowType,
        _key: uuid(),
        cells: Array(columnCount).fill(''),
      })
    }
    return updateValue({...value, rows: newRows})
  }

  const addRowAt = (index = 0) => {
    if (!value?.rows) {
      return
    }
    const newRows = deepClone(value.rows)
    // Calculate the column count from the first row
    const columnCount = value.rows[0]?.cells.length ?? 0

    newRows.splice(index, 0, {
      _type: rowType,
      _key: uuid(),
      cells: Array(columnCount).fill(''),
    })

    return updateValue({...value, rows: newRows})
  }

  const removeRow = (index: number) => {
    if (!value?.rows) {
      return
    }
    const newRows = deepClone(value.rows)
    newRows.splice(index, 1)
    updateValue({...value, rows: newRows})
    setDialog(null)
  }

  const confirmRemoveRow = (index: number) => {
    if (!value?.rows) {
      return
    }
    if (value.rows.length <= 1) return confirmRemoveTable()
    return setDialog({type: 'row', callback: () => removeRow(index)})
  }

  const confirmRemoveColumn = (index: number) => {
    if (!value?.rows) {
      return
    }
    if ((value.rows[0]?.cells.length ?? 0) <= 1) return confirmRemoveTable()
    return setDialog({type: 'column', callback: () => removeColumn(index)})
  }

  const addColumns = (count: number) => {
    if (!value?.rows) {
      return
    }
    const newRows = deepClone(value.rows)
    // Add a cell to each of the rows
    newRows.forEach((row) => {
      for (let j = 0; j < count; j++) {
        row.cells.push('')
      }
    })
    return updateValue({...value, rows: newRows})
  }

  const addColumnAt = (index: number) => {
    if (!value?.rows) {
      return
    }
    const newRows = deepClone(value.rows)

    newRows.forEach((row) => {
      row.cells.splice(index, 0, '')
    })

    return updateValue({...value, rows: newRows})
  }

  const removeColumn = (index: number) => {
    if (!value?.rows) {
      return
    }
    const newRows = deepClone(value.rows)
    newRows.forEach((row) => {
      row.cells.splice(index, 1)
    })
    updateValue({...value, rows: newRows})
    setDialog(null)
  }

  const updateCell = (e: ChangeEvent<HTMLInputElement>, rowIndex: number, cellIndex: number) => {
    if (!value?.rows) {
      return
    }
    const newRows = deepClone(value.rows)
    const row = newRows[rowIndex]
    if (!row) {
      return
    }
    row.cells[cellIndex] = e.currentTarget.value
    return updateValue({...value, rows: newRows})
  }

  return (
    <div>
      {dialog && (
        <Dialog
          header={`Remove ${dialog.type}`}
          id="dialog-remove"
          onClose={() => setDialog(null)}
          zOffset={1000}
        >
          <Card padding={4}>
            <Text>Are you sure you want to remove this {dialog.type}?</Text>
            <Box marginTop={4}>
              <Inline gap={1} style={{textAlign: 'right'}}>
                <Button text="Cancel" mode="ghost" onClick={() => setDialog(null)} />
                <Button text="Confirm" tone="critical" onClick={() => dialog.callback()} />
              </Inline>
            </Box>
          </Card>
        </Dialog>
      )}
      <Box>
        <Flex justify="flex-end">
          {value?.rows?.length ? (
            <TableMenu
              addColumns={addColumns}
              addColumnAt={addColumnAt}
              addRows={addRows}
              addRowAt={addRowAt}
              remove={confirmRemoveTable}
              placement="left"
            />
          ) : null}
        </Flex>
      </Box>
      {value?.rows?.length ? (
        <TableInput
          rows={value.rows}
          removeRow={confirmRemoveRow}
          removeColumn={confirmRemoveColumn}
          updateCell={updateCell}
        />
      ) : null}
      {!value || !value?.rows?.length ? (
        <Inline gap={1}>
          <Button
            fontSize={1}
            padding={3}
            icon={AddIcon}
            text="Create Table"
            tone="primary"
            mode="ghost"
            onClick={createTable}
          />
        </Inline>
      ) : null}
    </div>
  )
}

export function createTableComponent(rowType: string) {
  return function Table(props: TableProps) {
    return <TableComponent {...props} rowType={rowType} />
  }
}
