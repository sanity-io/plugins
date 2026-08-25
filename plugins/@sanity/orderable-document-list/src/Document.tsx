import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronUpIcon} from '@sanity/icons/ChevronUp'
import {DragHandleIcon} from '@sanity/icons/DragHandle'
import {AvatarCounter, Card, Box, Button, Flex, Text} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {useContext} from 'react'
import {
  useSchema,
  PreviewCard,
  Preview,
  DocumentVersionsStatus,
  DocumentVersionsStatusIndicator,
  getPublishedId,
  useDocumentVersions,
} from 'sanity'
import {usePaneRouter} from 'sanity/structure'

import {OrderableContext} from './OrderableContext'
import type {SanityDocumentWithOrder} from './types'

export interface DocumentProps {
  doc: SanityDocumentWithOrder
  entities: SanityDocumentWithOrder[]
  increment: (
    index: number,
    nextIndex: number,
    docId: string,
    entities: SanityDocumentWithOrder[],
  ) => void
  index: number
  isFirst: boolean
  isLast: boolean
  dragBadge: number | false
}

export function Document({
  doc,
  increment,
  entities,
  index,
  isFirst,
  isLast,
  dragBadge,
}: DocumentProps) {
  const {showIncrements} = useContext(OrderableContext)
  const schema = useSchema()
  const router = usePaneRouter()
  const publishedId = getPublishedId(doc._id)
  const {versions} = useDocumentVersions({documentId: publishedId})

  const {ChildLink, groupIndex, routerPanesState} = router

  const currentDoc = routerPanesState[groupIndex + 1]?.[0]?.id || false
  const pressed = currentDoc === doc._id || currentDoc === doc._id.replace(`drafts.`, ``)
  const selected = pressed && routerPanesState.length === groupIndex + 2
  const schemaType = schema.get(doc._type)

  if (!schemaType) {
    return null
  }

  const tooltip = <DocumentVersionsStatus documentGroupId={publishedId} />

  return (
    <PreviewCard
      __unstable_focusRing
      as={ChildLink}
      data-as="a"
      data-ui="PaneItem"
      radius={2}
      pressed={pressed}
      selected={selected}
      sizing="border"
      tabIndex={-1}
      tone="inherit"
      width="100%"
      flex={1}
      childId={doc._id}
    >
      <Flex align="center">
        <Box paddingX={2} style={{flexShrink: 0}}>
          <Text size={2}>
            <DragHandleIcon cursor="grab" />
          </Text>
        </Box>
        {showIncrements && (
          <Flex style={{flexShrink: 0}} align="center" gap={1} paddingRight={1}>
            <Button
              padding={2}
              mode="ghost"
              onClick={() => increment(index, index - 1, doc._id, entities)}
              disabled={isFirst}
              icon={ChevronUpIcon}
            />
            <Button
              padding={2}
              mode="ghost"
              disabled={isLast}
              onClick={() => increment(index, index + 1, doc._id, entities)}
              icon={ChevronDownIcon}
            />
          </Flex>
        )}
        <Box style={{width: `100%`}}>
          <Tooltip content={tooltip} portal placement="right" boundaryElement={null}>
            <Flex flex={1} align="center" justify="space-between" paddingRight={3}>
              <Preview layout="default" value={doc} schemaType={schemaType} />

              <Flex align="center" style={{flexShrink: 0}}>
                <DocumentVersionsStatusIndicator documentVersions={versions} />
              </Flex>
            </Flex>
          </Tooltip>
        </Box>
        {dragBadge && (
          <Card tone="default" marginRight={4} radius={5}>
            <AvatarCounter count={dragBadge} />
          </Card>
        )}
      </Flex>
    </PreviewCard>
  )
}
