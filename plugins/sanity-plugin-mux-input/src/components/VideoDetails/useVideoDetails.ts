import {useToast} from '@sanity/ui/toast'
import {useMemo, useState} from 'react'
import {useDocumentStore} from 'sanity'

import {useClient} from '../../hooks/useClient'
import useDocReferences from '../../hooks/useDocReferences'
import {useResyncAsset} from '../../hooks/useResyncAsset'
import getVideoMetadata from '../../util/getVideoMetadata'
import {type PluginConfig, type VideoAssetDocument} from '../../util/types'

type VideoDetailsState = 'idle' | 'saving' | 'deleting' | 'closing' | 'resyncing'

export interface VideoDetailsProps {
  closeDialog: () => void
  asset: VideoAssetDocument & {autoPlay?: boolean}
  config: PluginConfig
}

export default function useVideoDetails(props: VideoDetailsProps) {
  const documentStore = useDocumentStore()
  const toast = useToast()
  const client = useClient()

  const [references, referencesLoading] = useDocReferences(
    useMemo(() => ({documentStore, id: props.asset._id}), [documentStore, props.asset._id]),
  )

  // Only an edit is local: until then the title follows the document, a resync included.
  const [draftFilename, setFilename] = useState<string>()
  const filename = draftFilename ?? props.asset.filename
  const modified = draftFilename !== undefined && draftFilename !== props.asset.filename

  const displayInfo = getVideoMetadata({...props.asset, filename})

  const [state, setState] = useState<VideoDetailsState>('idle')

  const {resyncAsset, isResyncing} = useResyncAsset({showToast: true})

  async function handleResync() {
    if (state !== 'idle') return
    setState('resyncing')
    await resyncAsset(props.asset)
    setState('idle')
  }

  function handleClose() {
    if (state !== 'idle') return

    if (modified) {
      setState('closing')
      return
    }

    props.closeDialog()
  }

  function confirmClose(shouldClose: boolean) {
    if (state !== 'closing') return

    if (shouldClose) props.closeDialog()

    setState('idle')
  }

  async function saveChanges() {
    if (state !== 'idle') return
    setState('saving')

    try {
      await client.patch(props.asset._id).set({filename}).commit()
      setFilename(undefined)
      toast.push({
        title: 'Video title updated',
        description: `New title: ${filename}`,
        status: 'success',
      })
      props.closeDialog()
    } catch (error) {
      toast.push({
        title: 'Failed updating file name',
        status: 'error',
        description: typeof error === 'string' ? error : 'Please try again',
      })
      setFilename(undefined)
    }

    setState('idle')
  }

  return {
    references,
    referencesLoading,
    modified,
    filename,
    setFilename,
    displayInfo,
    state,
    setState,
    handleClose,
    confirmClose,
    saveChanges,
    handleResync,
    isResyncing,
  }
}
