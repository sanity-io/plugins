import {useEffect, useState} from 'react'
import {
  isImage,
  isReference,
  ObjectSchemaType,
  PreviewProps,
  ReferenceSchemaType,
  useClient,
} from 'sanity'

import {VariantPreviewProps} from '../types'
import {useExperimentContext} from './ExperimentContext'

export const VariantPreview = (props: PreviewProps) => {
  const [subtitle, setSubtitle] = useState<string | undefined>(undefined)
  const [title, setTitle] = useState<string | undefined>(undefined)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [media, setMedia] = useState<any>(undefined)
  const client = useClient({apiVersion: '2025-01-01'})
  const {experiments} = useExperimentContext()

  const {experiment, variant, value} = props as VariantPreviewProps

  const selectedExperiment = experiments.find((experimentItem) => {
    return experimentItem.id === experiment
  })

  const selectedVariant = selectedExperiment?.variants.find((variantItem) => {
    return variantItem.id === variant
  })

  useEffect(() => {
    const getSubtitle = async () => {
      setTitle(`${selectedExperiment?.label} - ${selectedVariant?.label}`)
      if (typeof value === 'string') {
        return setSubtitle(value)
      }
      if (isReference(value)) {
        const doc = await client.getDocument(value._ref)
        const type = props.schemaType as ObjectSchemaType
        const valueField = type.fields.find((field) => field.name === 'value') as ObjectSchemaType
        const referenceField = valueField?.type as ReferenceSchemaType
        const referenceType = referenceField.to.find((field) => field.type?.name === doc?._type)

        const selectFields = {} as Record<string, unknown>
        const previewFields = referenceType?.preview?.select || {}
        Object.keys(previewFields).forEach((key) => {
          const valueKey = referenceType?.preview?.select?.[key]
          selectFields[key] =
            valueKey && doc
              ? valueKey?.split('.').reduce((acc, index) => acc[index], doc)
              : undefined
        })

        const previewContent = referenceType?.preview?.prepare?.(selectFields)
        setMedia(previewContent?.media || selectFields.media)
        return setSubtitle(previewContent?.title || (selectFields?.title as string))
      }
      if (isImage(value)) {
        setMedia(value)
      }
      return ''
    }
    getSubtitle()
  }, [value, client, selectedExperiment?.label, selectedVariant?.label, props.schemaType])

  const previewProps = {
    ...props,
    title: title,
    subtitle: subtitle,
    media: media,
  }

  return props.renderDefault(previewProps)
}
