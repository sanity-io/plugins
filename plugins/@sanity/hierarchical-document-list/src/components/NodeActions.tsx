import {CopyIcon, EllipsisVerticalIcon, LaunchIcon, RemoveCircleIcon} from '@sanity/icons'
import {Button, Menu, MenuButton, MenuDivider, MenuItem} from '@sanity/ui'
import {type ComponentProps} from 'react'
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

  // `MenuItem` forwards these `IntentLink` props to the link at runtime even though
  // its `@sanity/ui` types don't expose them, so they're spread to bypass the
  // excess-property check (adapted from ArrayItemReferenceInput's `as` link pattern).
  const openLinkProps: Pick<ComponentProps<typeof IntentLink>, 'intent' | 'params'> = {
    intent: 'edit',
    params: {id: referenceId, type: docType},
  }

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
            {...openLinkProps}
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
