import {RemoveIcon} from '@sanity/icons'
import {Box, Button, TextInput} from '@sanity/ui'
import type {ChangeEvent} from 'react'

import type {TableRow} from './TableComponent'

interface TableInputProps {
  rows: TableRow[]
  updateCell: (e: ChangeEvent<HTMLInputElement>, rowIndex: number, cellIndex: number) => void
  removeRow: (index: number) => void
  removeColumn: (index: number) => void
}

export const TableInput = (props: TableInputProps) => {
  const {rows, updateCell, removeRow, removeColumn} = props

  return (
    <table style={{width: '100%'}}>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={row._key}>
            {row.cells.map((cell, cellIndex) => (
              // Cells are plain strings; the cell position is the only stable identity
              // eslint-disable-next-line react/no-array-index-key
              <td key={`${row._key}-${cellIndex}`}>
                <TextInput
                  fontSize={1}
                  padding={3}
                  value={cell}
                  onChange={(e) => updateCell(e, rowIndex, cellIndex)}
                />
              </td>
            ))}
            <td key={`${row._key}-remove`}>
              <Box marginLeft={1} style={{textAlign: 'center'}}>
                <Button
                  icon={RemoveIcon}
                  padding={2}
                  onClick={() => removeRow(rowIndex)}
                  mode="bleed"
                />
              </Box>
            </td>
          </tr>
        ))}
        <tr>
          {(rows[0]?.cells || []).map((_, i) => (
            // Cells are plain strings; the column position is the only stable identity
            // eslint-disable-next-line react/no-array-index-key
            <td key={i}>
              <Box marginTop={1} style={{textAlign: 'center'}}>
                <Button
                  icon={RemoveIcon}
                  padding={2}
                  onClick={() => removeColumn(i)}
                  mode="bleed"
                />
              </Box>
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  )
}
