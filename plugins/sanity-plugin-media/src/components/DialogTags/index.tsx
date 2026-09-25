import {Box} from '@sanity/ui'
import {type ReactNode} from 'react'

import {useMediaActors} from '../../contexts/MediaActorsContext'
import type {DialogTagsProps} from '../../types'
import Dialog from '../Dialog'
import TagView from '../TagView'

type Props = {
  children: ReactNode
  dialog: DialogTagsProps
}

const DialogTags = (props: Props) => {
  const {
    children,
    dialog: {id},
  } = props

  const {dialogs} = useMediaActors()

  const handleClose = () => {
    dialogs.send({type: 'dialogs.clear'})
  }

  return (
    <Dialog animate header="All Tags" id={id} onClose={handleClose} width={1}>
      <Box
        style={{
          height: '100%',
          minHeight: '420px', // explicit height required as <TagView> is virtualized
        }}
      >
        <TagView />
      </Box>

      {children}
    </Dialog>
  )
}

export default DialogTags
