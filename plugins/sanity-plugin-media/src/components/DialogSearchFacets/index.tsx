import {Box} from '@sanity/ui'
import {type ReactNode} from 'react'

import {useMediaActors} from '../../contexts/MediaActorsContext'
import type {DialogSearchFacetsProps} from '../../types'
import Dialog from '../Dialog'
import SearchFacets from '../SearchFacets'
import SearchFacetsControl from '../SearchFacetsControl'

type Props = {
  children: ReactNode
  dialog: DialogSearchFacetsProps
}

const DialogSearchFacets = (props: Props) => {
  const {
    children,
    dialog: {id},
  } = props

  const {dialogs} = useMediaActors()

  const handleClose = () => {
    dialogs.send({type: 'dialogs.clear'})
  }

  return (
    <Dialog animate header="Filters" id={id} onClose={handleClose} width={1}>
      <Box padding={3}>
        <SearchFacets layout="stack" />
        <SearchFacetsControl />
      </Box>

      {children}
    </Dialog>
  )
}

export default DialogSearchFacets
