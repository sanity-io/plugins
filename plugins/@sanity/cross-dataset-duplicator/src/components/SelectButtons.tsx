import {isAssetId} from '@sanity/asset-utils'
import {Button, Card, Flex} from '@sanity/ui'
import {type Dispatch, type SetStateAction, useState} from 'react'

import type {PayloadItem} from './Duplicator'

type Action = 'ALL' | 'NONE' | 'NEW' | 'EXISTING' | 'OLDER' | 'ASSETS' | 'DOCUMENTS'

type ButtonItem = {label: string; action: Action} | {divider: string}

const buttons: ButtonItem[] = [
  {label: 'All', action: 'ALL'},
  {label: 'None', action: 'NONE'},
  {divider: 'divider-1'},
  {label: 'New', action: 'NEW'},
  {label: 'Existing', action: 'EXISTING'},
  {label: 'Older', action: 'OLDER'},
  {divider: 'divider-2'},
  {label: 'Documents', action: 'DOCUMENTS'},
  {label: 'Assets', action: 'ASSETS'},
]

function shouldInclude(item: PayloadItem, action: Action): boolean {
  switch (action) {
    case 'ALL':
      return true
    case 'NONE':
      return false
    case 'NEW':
      return item.status === 'CREATE'
    case 'EXISTING':
      return item.status === 'EXISTS'
    case 'OLDER':
      return item.status === 'OVERWRITE'
    case 'ASSETS':
      return isAssetId(item.doc._id)
    case 'DOCUMENTS':
      return !isAssetId(item.doc._id)
    default:
      return item.include
  }
}

type SelectButtonsProps = {
  payload: PayloadItem[]
  setPayload: Dispatch<SetStateAction<PayloadItem[]>>
}

export default function SelectButtons(props: SelectButtonsProps) {
  const {payload, setPayload} = props
  const [disabledActions, setDisabledActions] = useState<Action[]>(() =>
    payload.length && payload.every((item) => item.include) ? ['ALL'] : [],
  )

  function handleSelectButton(action: Action) {
    if (!payload.length) return

    setPayload((current) =>
      current.map((item) => ({...item, include: shouldInclude(item, action)})),
    )
    setDisabledActions([action])
  }

  return (
    <Card padding={1} radius={3} shadow={1}>
      <Flex gap={2} wrap="wrap">
        {buttons.map((button) =>
          'action' in button ? (
            <Button
              key={button.action}
              fontSize={1}
              mode="bleed"
              padding={2}
              text={button.label}
              disabled={disabledActions.includes(button.action)}
              onClick={() => handleSelectButton(button.action)}
            />
          ) : (
            <Card key={button.divider} borderLeft />
          ),
        )}
      </Flex>
    </Card>
  )
}
