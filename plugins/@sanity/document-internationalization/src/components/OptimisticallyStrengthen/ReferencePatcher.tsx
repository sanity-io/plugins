import {useEffect} from 'react'
import {unset} from 'sanity'
import {useUnstableObserveDocument} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'
import {useDocumentPane} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver-1'
import {PatchEvent} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2'

import type {TranslationReference} from '../../types'

type ReferencePatcherProps = {
  translation: TranslationReference
}

// For every reference, check if it is published, and if so, strengthen the reference
export default function ReferencePatcher(props: ReferencePatcherProps) {
  const {translation} = props
  const {document: publishedDocument, loading} = useUnstableObserveDocument(translation.value._ref)
  const {onChange, ready, formState} = useDocumentPane()

  useEffect(() => {
    if (
      // We have a reference
      translation.value._ref &&
      // It's still weak and not-yet-strengthened
      translation.value._weak &&
      // We also want to keep this check because maybe the user *configured* weak refs
      translation.value._strengthenOnPublish &&
      !loading &&
      publishedDocument &&
      // The metadata pane is ready to accept patches
      ready &&
      !formState?.readOnly
    ) {
      const referencePathBase = ['translations', {_key: translation._key}, 'value']

      onChange(
        new PatchEvent([
          unset([...referencePathBase, '_weak']),
          unset([...referencePathBase, '_strengthenOnPublish']),
        ]),
      )
    }
  }, [
    formState?.readOnly,
    loading,
    onChange,
    publishedDocument,
    ready,
    translation._key,
    translation.value._ref,
    translation.value._strengthenOnPublish,
    translation.value._weak,
  ])

  return null
}
