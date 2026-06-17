import {Box} from '@sanity/ui'
import {type ReactNode, useCallback} from 'react'
import {useDispatch} from 'react-redux'

import {dialogActions} from '../../modules/dialog'
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

  // Redux
  const dispatch = useDispatch()

  // Callbacks
  const handleClose = useCallback(() => {
    dispatch(dialogActions.clear())
  }, [])

  return (
    <Dialog header="Choose an asset for replacing" id={id} onClose={handleClose} width={3}>
      <Box padding={4} style={{height: '50vh'}}>
        <ReplaceAssetsOverview />
      </Box>

      {children}
    </Dialog>
  )
}

export default DialogAllAssets
