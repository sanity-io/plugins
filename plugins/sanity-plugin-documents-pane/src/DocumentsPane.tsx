import {Stack} from '@sanity/ui'
import {Feedback} from 'sanity-plugin-utils'

import Debug from './Debug'
import Documents from './Documents'
import resolveInitialValueTemplates from './resolveInitialValueTemplates'
import resolveParams from './resolveParams'
import type {DocumentsPaneProps} from './types'

export default function DocumentsPane(props: DocumentsPaneProps) {
  const {document} = props
  const {
    query,
    params,
    useDraft = false,
    debug = false,
    initialValueTemplates: initialValueTemplatesResolver,
    options = {},
    duplicate = false,
  } = props.options

  if (useDraft && typeof params === 'function') {
    return (
      <Stack gap={5} padding={4}>
        <Feedback>
          <code>useDraft</code> should not be <code>true</code> when supplying a function for
          <code>params</code>
        </Feedback>
        {debug ? <Debug query={query} /> : null}
      </Stack>
    )
  }

  const paramValues = resolveParams({document, params, useDraft})

  const initialValueTemplates = resolveInitialValueTemplates({
    resolver: initialValueTemplatesResolver,
    document,
  })

  if (!paramValues) {
    return (
      <Stack gap={5} padding={4}>
        <Feedback>
          Parameters for this query could not be resolved. This may mean the document does not yet
          exist, or is incomplete.
        </Feedback>
        {debug ? <Debug query={query} /> : null}
      </Stack>
    )
  }

  return (
    <Documents
      query={query}
      params={paramValues}
      options={options}
      debug={debug}
      initialValueTemplates={initialValueTemplates}
      duplicate={duplicate}
    />
  )
}
