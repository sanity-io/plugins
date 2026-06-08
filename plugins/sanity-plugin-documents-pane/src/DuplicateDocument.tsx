import {CopyIcon} from '@sanity/icons'
import {Box, Button, Text, Tooltip} from '@sanity/ui'
import {fromString as pathFromString} from '@sanity/util/paths'
import {uuid} from '@sanity/uuid'
import {useCallback, useState, type MouseEvent} from 'react'
import {filter, firstValueFrom} from 'rxjs'
import {
  useDocumentOperation,
  useDocumentPairPermissions,
  useDocumentStore,
  useTranslation,
} from 'sanity'
import {structureLocaleNamespace} from 'sanity/structure'
import {usePaneRouter} from 'sanity/structure'

interface DuplicateDocumentProps {
  id: string
  type: string
}

export default function DuplicateDocument(props: DuplicateDocumentProps) {
  const {id, type} = props

  const documentStore = useDocumentStore()
  const {duplicate} = useDocumentOperation(id, type)
  const {routerPanesState, groupIndex, handleEditReference} = usePaneRouter()
  const [isDuplicating, setDuplicating] = useState(false)
  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    permission: 'duplicate',
  })

  const {t} = useTranslation(structureLocaleNamespace)

  const handle = useCallback(
    async (event: MouseEvent<HTMLElement>) => {
      event.stopPropagation()
      const dupeId = uuid()

      setDuplicating(true)

      const duplicateSuccess = firstValueFrom(
        documentStore.pair
          .operationEvents(id, type)
          .pipe(filter((e) => e.op === 'duplicate' && e.type === 'success')),
      )
      duplicate.execute(dupeId)

      await duplicateSuccess
      setDuplicating(false)

      const childParams = routerPanesState[groupIndex + 1]?.[0]?.params || {}
      const {parentRefPath} = childParams

      handleEditReference({
        id: dupeId,
        type,
        parentRefPath: parentRefPath ? pathFromString(parentRefPath) : [''],
        template: {id: dupeId},
      })
    },
    [documentStore.pair, duplicate, groupIndex, handleEditReference, id, routerPanesState, type],
  )

  if (isPermissionsLoading || !permissions?.granted) {
    return null
  }

  return (
    <Tooltip
      content={
        <Box>
          <Text muted size={1}>
            {t('action.duplicate.label')}
          </Text>
        </Box>
      }
      placement="left"
      portal
    >
      <Button
        aria-label={t('action.duplicate.label')}
        as={Box}
        disabled={isDuplicating || Boolean(duplicate.disabled) || isPermissionsLoading}
        fontSize={1}
        icon={CopyIcon}
        mode="ghost"
        onClick={handle}
        padding={2}
        style={{cursor: 'pointer'}}
        tone="default"
      />
    </Tooltip>
  )
}
