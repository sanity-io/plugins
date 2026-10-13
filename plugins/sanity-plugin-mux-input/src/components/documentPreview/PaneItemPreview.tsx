// Adapted from:
// https://github.com/sanity-io/sanity/blob/current/packages/sanity/src/structure/components/paneItem/PaneItemPreview.tsx
import {Inline} from '@sanity/ui'
import {isNumber, isString} from 'lodash'
import {isValidElement, useMemo} from 'react'
import {useObservable} from 'react-rx'
import type {SanityDocument, SchemaType} from 'sanity'
import {
  type DocumentPresence,
  DocumentPreviewPresence,
  type DocumentPreviewStore,
  type GeneralPreviewLayoutKey,
  getPreviewStateObservable,
  getPreviewValueWithFallback,
  isRecord,
  SanityDefaultPreview,
} from 'sanity'

import {DraftStatus} from './DraftStatus'
import {PublishedStatus} from './PublishedStatus'

export interface PaneItemPreviewProps {
  documentPreviewStore: DocumentPreviewStore
  icon: React.ComponentType | false
  layout: GeneralPreviewLayoutKey
  presence?: DocumentPresence[]
  schemaType: SchemaType
  value: SanityDocument
}

const INITIAL_PREVIEW_STATE = {
  snapshot: null,
  isLoading: true,
  original: null,
}

export function PaneItemPreview(props: PaneItemPreviewProps) {
  const {icon, layout, presence, schemaType, value} = props
  const title =
    (isRecord(value['title']) && isValidElement(value['title'])) ||
    isString(value['title']) ||
    isNumber(value['title'])
      ? value['title']
      : null

  const previewStateObservable = useMemo(
    () => getPreviewStateObservable(props.documentPreviewStore, schemaType, value._id),
    [props.documentPreviewStore, schemaType, value._id],
  )
  const {snapshot, original, isLoading} = useObservable(
    previewStateObservable,
    INITIAL_PREVIEW_STATE,
  )

  const status = isLoading ? null : (
    <Inline gap={4}>
      {presence && presence.length > 0 && <DocumentPreviewPresence presence={presence} />}
      <PublishedStatus document={original} />
      <DraftStatus document={snapshot} />
    </Inline>
  )

  return (
    <SanityDefaultPreview
      {...(getPreviewValueWithFallback({snapshot, original, fallback: {title}}) as any)}
      isPlaceholder={isLoading}
      icon={icon}
      layout={layout}
      status={status}
    />
  )
}
