import {Box, Dialog, Stack} from '@sanity/ui'
import {useId} from 'react'

import {useDialogStateContext} from '../context/DialogStateContext'
import {getMezzanineStatus} from '../hooks/useMezzanine'
import {DIALOGS_Z_INDEX} from '../util/constants'
import type {VideoAssetDocument} from '../util/types'
import Mezzanine from './Mezzanine'
import MezzanineExplanation from './MezzanineExplanation'

export interface Props {
  asset: VideoAssetDocument
  onClose?: () => void
}

/**
 * Player actions menu entry point: the explanation in the dialog body (until the
 * file is enabled) with the {@link Mezzanine} card below for the action/status.
 */
export default function MezzanineDialog({asset, onClose}: Props) {
  const {setDialogState} = useDialogStateContext()
  const dialogId = `MezzanineDialog${useId()}`

  const closing = () => {
    onClose?.()
    setDialogState(false)
  }

  const status = getMezzanineStatus(asset)
  const showExplanation = status !== 'preparing' && status !== 'ready'

  return (
    <Dialog
      id={dialogId}
      header="Mezzanine file"
      onClose={closing}
      zOffset={DIALOGS_Z_INDEX}
      width={1}
    >
      <Box padding={4}>
        <Stack space={4}>
          {showExplanation && <MezzanineExplanation />}
          <Mezzanine asset={asset} withExplanation={false} />
        </Stack>
      </Box>
    </Dialog>
  )
}
