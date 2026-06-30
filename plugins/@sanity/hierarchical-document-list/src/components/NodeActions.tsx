import {CopyIcon, EllipsisVerticalIcon, LaunchIcon, RemoveCircleIcon} from '@sanity/icons'
import {Button, Menu, MenuButton, MenuDivider, MenuItem} from '@sanity/ui'
import {IntentButton as IntentLink} from 'sanity'

import useTreeOperations from '../hooks/useTreeOperations'
import type {NodeProps} from '../types'

/**
 * Applicable only to nodes inside the main tree.
 * Unadded items have their actions defined in TreeEditor.
 */
const NodeActions = ({nodeProps}: {nodeProps: NodeProps}) => {
  const operations = useTreeOperations()
  const {node} = nodeProps
  const {reference, docType} = node?.value || {}
  const referenceId = reference?._ref

  const isValid = !!node.publishedId
  return (
    <MenuButton
      button={<Button padding={2} mode="bleed" icon={EllipsisVerticalIcon} />}
      id={`hiearchical-doc-list--${node._key}-menuButton`}
      menu={
        <Menu>
          <MenuItem
            text="Remove from list"
            tone="critical"
            icon={RemoveCircleIcon}
            onClick={() => operations.removeItem(nodeProps)}
          />
          <MenuItem
            text="Duplicate item"
            icon={CopyIcon}
            disabled={!isValid}
            onClick={() => operations.duplicateItem(nodeProps)}
          />
          {/* <MenuItem
            text="Move up"
            icon={ArrowUpIcon}
            disabled={!isValid}
            onClick={() => operations.moveItemUp(nodeProps)}
          />
          <MenuItem
            text="Move down"
            icon={ArrowDownIcon}
            disabled={!isValid}
            onClick={() => operations.moveItemDown(nodeProps)}
          /> */}
          <MenuDivider />
          <MenuItem
            text="Open in new tab"
            icon={LaunchIcon}
            disabled={!isValid}
            as={IntentLink}
            // @ts-expect-error `MenuItem` does not type the props of the polymorphic `as` component.
            intent="edit"
            params={{id: referenceId, type: docType}}
            target="_blank"
            rel="noopener noreferrer"
            data-as="a"
          />
        </Menu>
      }
      popover={{portal: true, tone: 'default', placement: 'right'}}
    />
  )
}

export default NodeActions
