import {Box, Dialog} from '@sanity/ui'
import {useId} from 'react'

import {useDialogStateContext} from '../../context/DialogStateContext'
import {DIALOGS_Z_INDEX} from '../../util/constants'
import {RobotsErrorBoundary} from './RobotsErrorBoundary'
import {RobotsPanel, type RobotsPanelProps} from './RobotsPanel'

/** The Robots panel, opened from the player's actions menu. */
export default function RobotsDialog(props: RobotsPanelProps) {
  const {setDialogState} = useDialogStateContext()
  const id = useId()
  return (
    <Dialog
      id={`robots${id}`}
      header="Robots"
      onClose={() => setDialogState(false)}
      zOffset={DIALOGS_Z_INDEX}
      width={2}
    >
      <Box padding={4}>
        <RobotsErrorBoundary>
          <RobotsPanel {...props} />
        </RobotsErrorBoundary>
      </Box>
    </Dialog>
  )
}
