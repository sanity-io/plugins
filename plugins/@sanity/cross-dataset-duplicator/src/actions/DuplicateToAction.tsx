import {LaunchIcon} from '@sanity/icons/Launch'
import {useState} from 'react'
import type {DocumentActionProps} from 'sanity'

import {CrossDatasetDuplicatorAction} from '../components/CrossDatasetDuplicatorAction'

/**
 * Document action from the Cross Dataset Duplicator plugin
 * @public
 */
export const DuplicateToAction = (props: DocumentActionProps) => {
  const {draft, published} = props
  const [dialogOpen, setDialogOpen] = useState(false)

  return {
    disabled: Boolean(draft),
    title: draft ? `Document must be Published to begin` : null,
    label: 'Duplicate to...',
    dialog: dialogOpen &&
      published && {
        type: 'modal',
        title: 'Cross Dataset Duplicator',
        content: <CrossDatasetDuplicatorAction docs={[published]} />,
        onClose: () => setDialogOpen(false),
      },
    onHandle: () => setDialogOpen(true),
    icon: LaunchIcon,
  }
}

DuplicateToAction.action = 'duplicateTo'
