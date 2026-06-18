import {ErrorOutlineIcon} from '@sanity/icons'
import {Box, Button, ButtonProps, Card} from '@sanity/ui'
import {CSSProperties, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {
  DefaultPreview,
  getPreviewStateObservable,
  getPreviewValueWithFallback,
  SanityDefaultPreview,
  SanityDocument,
  SchemaType,
  useDocumentPreviewStore,
  useSchema,
} from 'sanity'
import {useIntentLink} from 'sanity/router'

interface ResultPreviewProps {
  documentId: string
  schemaTypeName: string
  button?: boolean
  style?: CSSProperties
}

export function DocumentPreview({
  documentId,
  style,
  schemaTypeName,
  ...buttonProps
}: ResultPreviewProps & ButtonProps) {
  const schema = useSchema()
  const schemaType = schemaTypeName ? schema.get(schemaTypeName) : undefined

  if (!schemaTypeName) {
    return (
      <Card style={{minHeight: '36px'}}>
        <DefaultPreview
          withShadow={false}
          withBorder={false}
          title={'Loading...'}
          schemaType={schemaType}
          isPlaceholder
        />
      </Card>
    )
  }

  if (!schemaType) {
    return (
      <Card>
        <DefaultPreview
          withShadow={false}
          withBorder={false}
          media={() => <ErrorOutlineIcon />}
          title={
            <>
              Unknown type <code>{schemaTypeName ?? 'N/A'}</code> for {documentId}
            </>
          }
        />
      </Card>
    )
  }

  return (
    <DocumentPreviewInner
      documentId={documentId}
      schemaTypeName={schemaTypeName}
      schemaType={schemaType}
      style={style}
      {...buttonProps}
    />
  )
}

function DocumentPreviewInner({
  documentId,
  schemaType,
  style,
  button,
}: ResultPreviewProps & {schemaType: SchemaType} & ButtonProps) {
  const documentPreviewStore = useDocumentPreviewStore()

  const previewStateObservable = useMemo(
    () => getPreviewStateObservable(documentPreviewStore, schemaType, documentId),
    [documentId, documentPreviewStore, schemaType],
  )

  const {
    snapshot,
    original,
    isLoading: previewIsLoading,
  } = useObservable(previewStateObservable, {
    snapshot: null,
    isLoading: true,
    original: null,
  })

  const sanityDocument = useMemo(() => {
    return {
      _id: documentId,
      _type: schemaType?.name,
    } as SanityDocument
  }, [documentId, schemaType?.name])

  const {onClick: onIntentClick, href} = useIntentLink({
    intent: 'edit',
    params: {
      id: documentId,
      type: schemaType?.name,
    },
  })

  const preview = (
    <SanityDefaultPreview
      {...getPreviewValueWithFallback({
        snapshot,
        original,
        fallback: sanityDocument,
      })}
      isPlaceholder={previewIsLoading ?? true}
      layout="default"
      icon={schemaType?.icon}
    />
  )
  if (button) {
    return (
      <Button
        as={'a'}
        href={href}
        onClick={onIntentClick}
        mode="ghost"
        style={{width: '100%', ...style}}
      >
        {preview}
      </Button>
    )
  }
  return <Box style={{width: '100%'}}>{preview}</Box>
}
