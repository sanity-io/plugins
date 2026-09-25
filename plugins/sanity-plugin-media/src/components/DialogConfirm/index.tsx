import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Box, Button, Flex, Stack, Text} from '@sanity/ui'
import {type ReactNode} from 'react'

import {useMediaActors} from '../../contexts/MediaActorsContext'
import type {DialogConfirmProps} from '../../types'
import Dialog from '../Dialog'

type Props = {
  children?: ReactNode
  dialog: DialogConfirmProps
}

const DialogConfirm = (props: Props) => {
  const {children, dialog} = props

  const {dialogs, media} = useMediaActors()

  const handleClose = () => {
    dialogs.send({type: 'dialog.close', id: dialog.id})
  }

  const handleConfirm = () => {
    // Close target dialog, if provided
    if (dialog.closeDialogId) {
      dialogs.send({type: 'dialog.close', id: dialog.closeDialogId})
    }

    media.send(dialog.confirmEvent)

    // Close self
    handleClose()
  }

  const Footer = () => (
    <Box padding={3}>
      <Flex justify="space-between">
        <Button fontSize={1} mode="bleed" onClick={handleClose} text="Cancel" />
        <Button
          fontSize={1}
          onClick={handleConfirm}
          text={dialog?.confirmText}
          tone={dialog?.tone}
        />
      </Flex>
    </Box>
  )

  const Header = () => (
    <Flex align="center">
      <Box paddingX={1}>
        <WarningOutlineIcon />
      </Box>
      <Box marginLeft={2}>{dialog?.headerTitle}</Box>
    </Flex>
  )

  return (
    <Dialog
      animate
      // oxlint-disable-next-line react/static-components
      footer={<Footer />}
      // oxlint-disable-next-line react/static-components
      header={<Header />}
      id="confirm"
      onClose={handleClose}
      width={1}
    >
      <Box paddingX={4} paddingY={4}>
        <Stack gap={3}>
          {dialog?.title && <Text size={1}>{dialog.title}</Text>}
          {dialog?.description && (
            <Text muted size={1}>
              <em>{dialog.description}</em>
            </Text>
          )}
        </Stack>
      </Box>

      {children}
    </Dialog>
  )
}

export default DialogConfirm
