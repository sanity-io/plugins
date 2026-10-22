import {SortIcon} from '@sanity/icons/Sort'
import {Button} from '@sanity/ui'
import {Menu, MenuButton, MenuDivider, MenuItem} from '@sanity/ui/menu'
import {useSelector} from '@xstate/react'

import {getOrderTitle} from '../../config/orders'
import {ORDER_OPTIONS} from '../../constants'
import {useMediaActors} from '../../contexts/MediaActorsContext'
import {usePortalPopoverProps} from '../../hooks/usePortalPopoverProps'

const OrderSelect = () => {
  const {assets} = useMediaActors()
  const order = useSelector(assets, (snapshot) => snapshot.context.order)

  const popoverProps = usePortalPopoverProps()

  return (
    <MenuButton
      button={
        <Button
          fontSize={1}
          icon={SortIcon}
          mode="bleed"
          padding={3}
          text={getOrderTitle(order.field, order.direction)}
        />
      }
      id="order"
      menu={
        <Menu>
          {ORDER_OPTIONS?.map((item, index) => {
            if (item) {
              const selected = order.field === item.field && order.direction === item.direction
              return (
                <MenuItem
                  disabled={selected}
                  fontSize={1}
                  iconRight={selected}
                  key={index}
                  onClick={() =>
                    assets.send({
                      type: 'order.set',
                      order: {direction: item.direction, field: item.field},
                    })
                  }
                  padding={2}
                  selected={selected}
                  gap={4}
                  style={{minWidth: '200px'}}
                  text={getOrderTitle(item.field, item.direction)}
                />
              )
            }

            return <MenuDivider key={index} />
          })}
        </Menu>
      }
      popover={popoverProps}
    />
  )
}

export default OrderSelect
