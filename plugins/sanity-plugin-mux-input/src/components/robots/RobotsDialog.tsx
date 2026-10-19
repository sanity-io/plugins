import {Box, Dialog} from '@sanity/ui'
import {useId} from 'react'

import {useDialogStateContext} from '../../context/DialogStateContext'
import {useSummaryTarget} from '../../hooks/useSummaryTarget'
import {DIALOGS_Z_INDEX} from '../../util/constants'
import {RobotsErrorBoundary} from './RobotsErrorBoundary'
import {RobotsPanel, type RobotsPanelProps} from './RobotsPanel'

/**
 * The Robots panel, opened from the player's actions menu in a document's video field. There, a
 * summary can also be applied to that document's own fields.
 */
export default function RobotsDialog(props: Omit<RobotsPanelProps, 'summaryTarget'>) {
  const {setDialogState} = useDialogStateContext()
  const id = useId()
  const summaryTarget = useSummaryTarget()
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
          <RobotsPanel {...props} summaryTarget={props.readOnly ? undefined : summaryTarget} />
        </RobotsErrorBoundary>
      </Box>
    </Dialog>
  )
}
