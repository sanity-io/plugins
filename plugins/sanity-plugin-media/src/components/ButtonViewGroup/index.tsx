import {ThLargeIcon} from '@sanity/icons/ThLarge'
import {ThListIcon} from '@sanity/icons/ThList'
import {Button, Inline} from '@sanity/ui'
import {useSelector} from '@xstate/react'

import {useMediaActors} from '../../contexts/MediaActorsContext'

const ButtonViewGroup = () => {
  const {assets} = useMediaActors()
  const view = useSelector(assets, (snapshot) => snapshot.context.view)

  return (
    <Inline gap={0} style={{whiteSpace: 'nowrap'}}>
      <Button
        fontSize={1}
        icon={ThLargeIcon}
        mode={view === 'grid' ? 'default' : 'ghost'}
        onClick={() => assets.send({type: 'view.set', view: 'grid'})}
        style={{
          borderBottomRightRadius: 0,
          borderTopRightRadius: 0,
        }}
      />
      <Button
        fontSize={1}
        icon={ThListIcon}
        mode={view === 'table' ? 'default' : 'ghost'}
        onClick={() => assets.send({type: 'view.set', view: 'table'})}
        style={{
          borderBottomLeftRadius: 0,
          borderTopLeftRadius: 0,
        }}
      />
    </Inline>
  )
}

export default ButtonViewGroup
