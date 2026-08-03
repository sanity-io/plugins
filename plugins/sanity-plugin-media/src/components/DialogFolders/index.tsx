import {Box} from '@sanity/ui'
import {type ReactNode, useCallback} from 'react'
import {useDispatch} from 'react-redux'

import {dialogActions} from '../../modules/dialog'
import type {DialogFoldersProps} from '../../types'
import Dialog from '../Dialog'
import FolderView from '../FolderView'

type Props = {
  children: ReactNode
  dialog: DialogFoldersProps
}

const DialogFolders = (props: Props) => {
  const {
    children,
    dialog: {id},
  } = props

  const dispatch = useDispatch()

  const handleClose = useCallback(() => {
    dispatch(dialogActions.clear())
  }, [dispatch])

  return (
    <Dialog animate header="Folders" id={id} onClose={handleClose} width={1}>
      <Box
        style={{
          height: '100%',
          minHeight: '420px',
        }}
      >
        <FolderView />
      </Box>

      {children}
    </Dialog>
  )
}

export default DialogFolders
