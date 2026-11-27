import {type DocumentLayoutProps} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'
import {useSchema} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver-1'

import type {PluginConfig} from '../types'
import {hasInternationalizedArrayField} from '../utils/hasInternationalizedArrayField'
import {InternationalizedArrayProvider} from './InternationalizedArrayContext'

export function InternationalizedArrayLayout(
  props: DocumentLayoutProps & {pluginConfig: Required<PluginConfig>},
) {
  const schema = useSchema()
  const schemaType = schema.get(props.documentType)

  if (!schemaType) {
    console.error(`Schema type not found: ${props.documentType}`)
    return props.renderDefault(props)
  }

  const hasInternationalizedArray = hasInternationalizedArrayField(schemaType)
  if (hasInternationalizedArray && props.pluginConfig.includeForDocumentType(props.documentType)) {
    return (
      <InternationalizedArrayProvider
        internationalizedArray={props.pluginConfig}
        documentType={props.documentType}
      >
        {props.renderDefault(props)}
      </InternationalizedArrayProvider>
    )
  }

  return props.renderDefault(props)
}
