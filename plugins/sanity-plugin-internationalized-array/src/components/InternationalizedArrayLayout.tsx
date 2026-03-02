import {useSchema, type DocumentLayoutProps} from 'sanity'

import type {PluginConfig} from '../types'
import {hasInternationalizedArrayField} from '../utils/hasInternationalizedArrayField'
import {InternationalizedArrayProvider} from './InternationalizedArrayContext'

export function InternationalizedArrayLayout(
  props: DocumentLayoutProps & {pluginConfig: Required<PluginConfig>},
): React.ReactElement {
  const schema = useSchema()
  const schemaType = schema.get(props.documentType)
  if (!schemaType) {
    console.error(`Schema type not found: ${props.documentType}`)
    return props.renderDefault(props)
  }

  const hasInternationalizedArray = hasInternationalizedArrayField(schemaType)
  if (!hasInternationalizedArray) {
    return props.renderDefault(props)
  }

  return (
    <InternationalizedArrayProvider
      internationalizedArray={props.pluginConfig}
      documentType={props.documentType}
    >
      {props.renderDefault(props)}
    </InternationalizedArrayProvider>
  )
}
