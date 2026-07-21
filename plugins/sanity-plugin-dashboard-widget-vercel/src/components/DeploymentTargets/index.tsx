import {Stack} from '@sanity/ui'

import {type Sanity} from '../../types'
import DeploymentTarget from '../DeploymentTarget'

type Props = {
  items: Sanity.DeploymentTarget[]
  onDialogEdit: (deploymentTarget: Sanity.DeploymentTarget) => void
}

const DeploymentTargets = (props: Props) => {
  const {items, onDialogEdit} = props

  return (
    <Stack gap={5}>
      {items?.map((item) => (
        <DeploymentTarget item={item} key={item._id} onDialogEdit={onDialogEdit} />
      ))}
    </Stack>
  )
}

export default DeploymentTargets
