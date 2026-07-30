// oxlint-disable typescript/no-unsafe-type-assertion - legacy code will be lint-cleaned in a follow-up PR
// Adapted from https://github.com/sanity-io/sanity/blob/next/packages/sanity/src/desk/components/paneItem/PaneItem.tsx

import {DocumentIcon} from '@sanity/icons/Document'
import {useMemo} from 'react'
import type {CollatedHit, SanityDocument, SchemaType} from 'sanity'
import {PreviewCard, useDocumentPresence, useDocumentPreviewStore, useSchema} from 'sanity'
import {IntentLink} from 'sanity/router'

import {MissingSchemaType} from './MissingSchemaType'
import {PaneItemPreview} from './PaneItemPreview'

interface DocumentPreviewProps {
  schemaType?: SchemaType
  documentPair: CollatedHit<SanityDocument>
}

/**
 * Return `false` if we explicitly disable the icon.
 * Otherwise return the passed icon or the schema type icon as a backup.
 */
function getIconWithFallback(
  icon: React.ComponentType<any> | false | undefined,
  schemaType: SchemaType | undefined,
  defaultIcon: React.ComponentType<any>,
): React.ComponentType<any> | false {
  if (icon === false) {
    return false
  }

  return icon || ((schemaType && schemaType.icon) as any) || defaultIcon || false
}

export function DocumentPreview(props: DocumentPreviewProps) {
  const {schemaType, documentPair} = props
  const doc = documentPair?.draft || documentPair?.published
  const id = documentPair.id || ''
  const documentPreviewStore = useDocumentPreviewStore()
  const schema = useSchema()
  const documentPresence = useDocumentPresence(id)
  const hasSchemaType = Boolean(schemaType && schemaType.name && schema.get(schemaType.name))

  const children = useMemo(() => {
    if (!doc) return null

    if (!schemaType || !hasSchemaType) {
      return <MissingSchemaType value={doc} />
    }

    return (
      <PaneItemPreview
        documentPreviewStore={documentPreviewStore}
        icon={getIconWithFallback(undefined, schemaType, DocumentIcon)}
        schemaType={schemaType}
        layout="default"
        value={doc}
        presence={documentPresence}
      />
    )
  }, [hasSchemaType, schemaType, documentPresence, doc, documentPreviewStore])

  return (
    <PreviewCard
      __unstable_focusRing
      as={IntentLink}
      intent="edit"
      params={{id: props.documentPair.id}}
      data-as="a"
      data-ui="PaneItem"
      padding={2}
      radius={2}
      tone="inherit"
    >
      {children}
    </PreviewCard>
  )
}
