import {DownloadIcon, ResetIcon} from '@sanity/icons'
import {Button, Dialog, Stack, Text} from '@sanity/ui'
import {useCallback, useEffect, useId, useRef, useState} from 'react'

import {getAsset} from '../actions/assets'
import {enableMasterAccess, waitForMasterAccess} from '../actions/download'
import {useDialogStateContext} from '../context/DialogStateContext'
import {useClient} from '../hooks/useClient'
import {DIALOGS_Z_INDEX} from '../util/constants'
import {downloadFile} from '../util/downloadFile'
import type {VideoAssetDocument} from '../util/types'

type MuxMasterAccessStatus = 'idle' | 'preparing' | 'success' | 'error'

const PREPARE_TIMEOUT_SECONDS = 120
const PREPARE_INTERVAL_SECONDS = 5

export interface Props {
  asset: VideoAssetDocument
  onClose?: () => void
  absolute?: boolean
}

export default function DownloadAssetDialog({asset, onClose, absolute}: Props) {
  const client = useClient()

  const [status, setStatus] = useState<MuxMasterAccessStatus>('idle')
  const interruptedRef = useRef<boolean>(false)

  const {setDialogState} = useDialogStateContext()
  const dialogId = `DownloadAssetDialog${useId()}`

  const closing = useCallback(() => {
    onClose?.()
    setDialogState(false)
  }, [onClose, setDialogState])

  const prepareDownload = useCallback(async () => {
    const assetId = asset.assetId ?? ''
    interruptedRef.current = false
    setStatus('preparing')

    await enableMasterAccess(client, assetId)
    const link = await waitForMasterAccess(
      client,
      assetId,
      PREPARE_TIMEOUT_SECONDS,
      PREPARE_INTERVAL_SECONDS,
      () => interruptedRef.current
    )

    if (interruptedRef.current) return
    setStatus(link.length > 0 ? 'success' : 'error')
  }, [asset.assetId, client])

  const handleDownload = useCallback(async () => {
    const assetId = asset.assetId ?? ''
    const assetName = asset.filename ?? 'untitled'

    const res = await getAsset(client, assetId)
    closing()
    const url = res.data?.master?.url ?? ''
    if (url) await downloadFile(url, assetName)
  }, [asset.assetId, asset.filename, client, closing])

  useEffect(() => {
    void prepareDownload()
    return () => {
      interruptedRef.current = true
    }
  }, [prepareDownload])

  const isSuccess = status === 'success'
  const isPreparing = status === 'preparing'

  return (
    <Dialog
      id={dialogId}
      header="Download source file"
      onClose={closing}
      position={absolute ? 'fixed' : undefined}
      zOffset={DIALOGS_Z_INDEX}
      footer={
        <Stack padding={3}>
          <Button
            key="download"
            icon={isSuccess ? DownloadIcon : ResetIcon}
            text={isSuccess ? 'Download' : 'Retry'}
            tone={isSuccess ? 'positive' : 'critical'}
            mode="ghost"
            disabled={isPreparing}
            loading={isPreparing}
            onClick={isSuccess ? handleDownload : prepareDownload}
          />
        </Stack>
      }
    >
      <Stack paddingX={5} paddingY={3}>
        <Text hidden={status !== 'preparing'} align="center">
          Your download file is being prepared…
        </Text>
        <Text hidden={status !== 'success'} align="center">
          Your download file is ready.
        </Text>
        <Text hidden={status !== 'error'} align="center">
          Something went wrong during preparation.
        </Text>
      </Stack>
    </Dialog>
  )
}
