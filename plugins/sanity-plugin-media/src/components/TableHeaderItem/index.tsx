import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronUpIcon} from '@sanity/icons/ChevronUp'
import {Box, Label} from '@sanity/ui'
import {useSelector} from '@xstate/react'

import {useMediaActors} from '../../contexts/MediaActorsContext'

type Props = {
  field?: string
  title?: string
}

const TableHeaderItem = (props: Props) => {
  const {field, title} = props

  const {assets} = useMediaActors()
  const order = useSelector(assets, (snapshot) => snapshot.context.order)

  const isActive = order.field === field

  // Callbacks
  const handleClick = () => {
    if (!field || !title) {
      return
    }

    if (isActive) {
      const direction = order.direction === 'asc' ? 'desc' : 'asc'
      assets.send({type: 'order.set', order: {field, direction}})
    } else {
      assets.send({type: 'order.set', order: {field, direction: 'asc'}})
    }
  }

  return (
    <Label muted={!field} size={0}>
      <Box
        onClick={field ? handleClick : undefined}
        style={{
          cursor: field ? 'pointer' : 'default',
          display: 'inline',
          whiteSpace: 'nowrap',
        }}
      >
        <span
          style={{
            marginRight: '0.4em',
          }}
        >
          {title}
        </span>

        {isActive && order?.direction === 'asc' && <ChevronUpIcon />}
        {isActive && order?.direction === 'desc' && <ChevronDownIcon />}
      </Box>
    </Label>
  )
}

export default TableHeaderItem
