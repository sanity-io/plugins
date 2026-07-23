import {TrashIcon} from '@sanity/icons/Trash'
import {Box, Button, Card, Checkbox, Dialog, Flex, Heading, Stack, Text, useToast} from '@sanity/ui'
import {useState} from 'react'
import type {SanityDocument} from 'sanity'

import {deleteAsset} from '../../actions/assets'
import {useClient} from '../../hooks/useClient'
import {DIALOGS_Z_INDEX} from '../../util/constants'
import type {VideoAssetDocument} from '../../util/types'
import SpinnerBox from '../SpinnerBox'
import VideoReferences from './VideoReferences'

export default function DeleteDialog({
  asset,
  references,
  referencesLoading,
  cancelDelete,
  succeededDeleting,
}: {
  asset: VideoAssetDocument
  references?: SanityDocument[]
  referencesLoading: boolean
  cancelDelete: () => void
  succeededDeleting: () => void
}) {
  const client = useClient()
  const [state, setState] = useState<'idle' | 'processing_deletion' | 'error_deleting'>('idle')
  const [deleteOnMux, setDeleteOnMux] = useState(true)
  const toast = useToast()
  const referenceState = referencesLoading
    ? 'checkingReferences'
    : references?.length
      ? 'cantDelete'
      : 'confirm'
  const dialogState = state === 'idle' ? referenceState : state

  async function confirmDelete() {
    if (dialogState !== 'confirm') return

    setState('processing_deletion')
    const worked = await deleteAsset({client, asset, deleteOnMux})
    if (worked === true) {
      toast.push({title: 'Successfully deleted video', status: 'success'})
      succeededDeleting()
    } else if (worked === 'failed-mux') {
      toast.push({
        title: 'Deleted video in Sanity',
        description: "But it wasn't deleted in Mux",
        status: 'warning',
      })
      succeededDeleting()
    } else {
      toast.push({title: 'Failed deleting video', status: 'error'})

      setState('error_deleting')
    }
  }

  return (
    <Dialog
      animate
      header={'Delete video'}
      zOffset={DIALOGS_Z_INDEX}
      id="deleting-video-details-dialog"
      onClose={cancelDelete}
      onClickOutside={cancelDelete}
      width={1}
      position="fixed"
    >
      <Card
        padding={3}
        style={{
          minHeight: '150px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Stack space={3}>
          {dialogState === 'checkingReferences' && (
            <>
              <Heading size={2}>Checking if video can be deleted</Heading>
              <SpinnerBox />
            </>
          )}
          {dialogState === 'cantDelete' && (
            <>
              <Heading size={2}>Video can&apos;t be deleted</Heading>
              <Text size={2} style={{marginBottom: '2rem'}}>
                There are {references?.length} document{references && references.length > 0 && 's'}{' '}
                pointing to this video. Remove their references to this file or delete them before
                proceeding.
              </Text>
              <VideoReferences references={references} isLoaded={!referencesLoading} />
            </>
          )}
          {dialogState === 'confirm' && (
            <>
              <Heading size={2}>Are you sure you want to delete this video?</Heading>
              <Text size={2}>This action is irreversible</Text>
              <Stack space={4} marginY={4}>
                <Flex align="center" as="label">
                  <Checkbox
                    checked={deleteOnMux}
                    onChange={() => setDeleteOnMux((prev) => !prev)}
                  />
                  <Text style={{margin: '0 10px'}}>Delete asset on Mux</Text>
                </Flex>
                <Flex align="center" as="label">
                  <Checkbox disabled checked />
                  <Text style={{margin: '0 10px'}}>Delete video from dataset</Text>
                </Flex>
                <Box>
                  <Button
                    icon={TrashIcon}
                    fontSize={2}
                    padding={3}
                    text="Delete video"
                    tone="critical"
                    onClick={confirmDelete}
                    disabled={['processing_deletion', 'checkingReferences', 'cantDelete'].some(
                      (s) => s === dialogState,
                    )}
                  />
                </Box>
              </Stack>
            </>
          )}
          {dialogState === 'processing_deletion' && (
            <>
              <Heading size={2}>Deleting video...</Heading>
              <SpinnerBox />
            </>
          )}
          {dialogState === 'error_deleting' && (
            <>
              <Heading size={2}>Something went wrong!</Heading>
              <Text size={2}>Try deleting the video again by clicking the button below</Text>
            </>
          )}
        </Stack>
      </Card>
    </Dialog>
  )
}
