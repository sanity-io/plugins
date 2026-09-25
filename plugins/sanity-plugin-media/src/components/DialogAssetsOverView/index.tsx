import {Box} from '@sanity/ui'
import {type ReactNode} from 'react'

import {useMediaActors} from '../../contexts/MediaActorsContext'
import type {DialogAllAssetsProps} from '../../types'
import Dialog from '../Dialog'
import ReplaceAssetsOverview from '../ReplaceAssetsOverView'

type Props = {
  children: ReactNode
  dialog: DialogAllAssetsProps
}

const DialogAllAssets = (props: Props) => {
  const {
    children,
    dialog: {id},
  } = props

  const {dialogs} = useMediaActors()

  const handleClose = () => {
    dialogs.send({type: 'dialogs.clear'})
  }

  return (
    <Dialog header="Choose a replacement image" id={id} onClose={handleClose} width={3}>
      <Box padding={4} style={{height: '50vh'}}>
        <ReplaceAssetsOverview />
      </Box>

      {children}
    </Dialog>
  )
}

export default DialogAllAssets
