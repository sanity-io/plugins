import {Box, Card, Grid, Inline, Label, Text} from '@sanity/ui'
import type {PreviewProps} from 'sanity'

import type {TableRow} from './TableComponent'
import {TableIcon} from './TableIcon'

interface TablePreviewProps extends PreviewProps {
  rows?: TableRow[]
}

const Table = ({rows}: {rows: TableRow[]}) => {
  const numCols = rows[0]?.cells.length ?? 0

  return (
    <Grid gridTemplateColumns={numCols} padding={2}>
      {rows.map((row) =>
        row.cells.map((cell, i) => (
          // Cells are plain strings; the cell position is the only stable identity
          // eslint-disable-next-line react/no-array-index-key
          <Card key={row._key + i} padding={2} style={{outline: '1px solid #DFE2E9'}}>
            <Text textOverflow="ellipsis">{cell}</Text>
          </Card>
        )),
      )}
    </Grid>
  )
}

export const TablePreview = (props: TablePreviewProps) => {
  const {schemaType, rows = [], title} = props
  const previewTitle = schemaType?.title ?? (typeof title === 'string' ? title : 'Title missing')

  return (
    <>
      <Box padding={3}>
        <Inline gap={3}>
          <Card>
            <Label size={4}>
              <TableIcon />
            </Label>
          </Card>
          <Card>
            <Text>{previewTitle}</Text>
          </Card>
        </Inline>
      </Box>
      <Box padding={2}>
        {rows.length === 0 ? <Label muted>Empty Table</Label> : <Table rows={rows} />}
      </Box>
    </>
  )
}
