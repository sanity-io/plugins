import type {DocumentLayoutProps} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'

import {AssistDocumentContextProvider} from './AssistDocumentContextProvider'

export function AssistDocumentLayout(props: DocumentLayoutProps) {
  const {documentId, documentType} = props
  return (
    <AssistDocumentContextProvider documentType={documentType} documentId={documentId}>
      {props.renderDefault(props)}
    </AssistDocumentContextProvider>
  )
}
