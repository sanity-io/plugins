import {HelpCircleIcon} from '@sanity/icons'
import {Box, Card, Flex, Stack, Text, Tooltip} from '@sanity/ui'
import {type ReactNode, forwardRef, useMemo} from 'react'
import {Preview, type SanityDocument, type SchemaType, TextWithTone, useSchema} from 'sanity'
import {type RouterPaneGroup, usePaneRouter} from 'sanity/structure'

import useTreeOperations from '../hooks/useTreeOperations'
import type {LocalTreeItem} from '../types'
import DocumentPreviewStatus from './DocumentPreviewStatus'

/**
 * Renders a preview for each referenced document.
 * Nested inside TreeNode.tsx
 */
const DocumentInNode = (props: {item: LocalTreeItem; action?: ReactNode}) => {
  const {value: {reference, docType} = {}, draftId, publishedId} = props.item
  const referenceId = reference?._ref
  const {routerPanesState, ChildLink} = usePaneRouter()
  const {allItemsStatus} = useTreeOperations()
  const schema = useSchema()
  const isActive = useMemo(() => {
    // If some pane is active with the current document `_id`, it's active
    return routerPanesState.some((pane: RouterPaneGroup) =>
      pane.some((group) => group.id === referenceId),
    )
  }, [referenceId, routerPanesState])

  const type = useMemo(() => {
    return docType ? schema.get(docType) : undefined
  }, [docType, schema])

  const LinkComponent = useMemo(
    () =>
      forwardRef((linkProps: any, ref: any) => (
        <ChildLink
          {...linkProps}
          childId={referenceId}
          ref={ref}
          childParameters={{
            type: docType,
          }}
        />
      )),
    [ChildLink, docType, referenceId],
  )

  if (!reference?._ref) {
    return null
  }

  return (
    <Flex gap={2} align="center" style={{flex: 1}}>
      {/* Show loading preview while allItems aren't ready */}
      {publishedId || allItemsStatus !== 'success' ? (
        /* Card loosely copied from @sanity/desk-tool's PaneItem.tsx */
        <Card
          __unstable_focusRing
          as={LinkComponent}
          tone={isActive ? 'primary' : 'default'}
          padding={1}
          radius={2}
          flex={1}
          data-as="a"
          data-ui="PaneItem"
        >
          <Preview
            layout="default"
            schemaType={type as SchemaType}
            value={{_ref: draftId || reference?._ref}}
            status={
              <DocumentPreviewStatus
                draft={
                  draftId
                    ? ({
                        _id: draftId,
                        _type: docType,
                        _updatedAt: props.item.draftUpdatedAt,
                      } as SanityDocument)
                    : undefined
                }
                published={
                  {
                    _id: reference?._ref,
                    _type: docType,
                    _updatedAt: props.item.publishedUpdatedAt,
                  } as SanityDocument
                }
              />
            }
          />
        </Card>
      ) : (
        <Card padding={3} radius={1} flex={1}>
          <Flex align="center">
            <Text size={2} muted style={{flex: 1}}>
              Invalid document
            </Text>
            <Tooltip
              placement="left"
              portal
              content={
                <Box padding={3}>
                  <Flex align="flex-start" gap={3}>
                    <TextWithTone tone="default" size={3}>
                      <HelpCircleIcon />
                    </TextWithTone>
                    <Stack gap={3}>
                      <Text as="h2" size={1} weight="semibold">
                        This document is not valid
                      </Text>
                      {/* <Text size={1}>
                        It was deleted or it doesn't match the filters set by this hierarchy.
                      </Text> */}
                      <Text size={1}>ID: {reference?._ref}</Text>
                    </Stack>
                  </Flex>
                </Box>
              }
            >
              <TextWithTone tone="default" size={2}>
                <HelpCircleIcon />
              </TextWithTone>
            </Tooltip>
          </Flex>
        </Card>
      )}
      {props.action}
    </Flex>
  )
}

export default DocumentInNode
