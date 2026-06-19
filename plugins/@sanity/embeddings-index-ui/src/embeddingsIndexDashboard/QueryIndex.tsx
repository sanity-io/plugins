import {useCallback, useMemo} from 'react'
import {useRouter} from 'sanity/router'

// @ts-expect-error - legacy type-check issue will be lint-cleaned in a follow-up PR
import {QueryResult} from '../api/embeddingsApi'
import {SemanticSearchAutocomplete} from '../referenceInput/SemanticSearchAutocomplete'
// @ts-expect-error - legacy type-check issue will be lint-cleaned in a follow-up PR
import {EmbeddingsIndexConfig} from '../schemas/typeDefExtensions'

export function QueryIndex(props: {indexName: string}) {
  const {indexName} = props
  const getEmpty = useCallback(() => 'anything', [])
  const indexConfig: EmbeddingsIndexConfig = useMemo(
    () => ({indexName, maxResults: 8}),
    [indexName],
  )

  const {resolveIntentLink, navigateUrl} = useRouter()
  const onSelect = useCallback(
    (hit: QueryResult) => {
      navigateUrl({
        path: resolveIntentLink('edit', {id: hit.value.documentId, type: hit.value.type}),
      })
    },
    [resolveIntentLink, navigateUrl],
  )
  return (
    <SemanticSearchAutocomplete
      getEmptySearchValue={getEmpty}
      indexConfig={indexConfig}
      onSelect={onSelect}
    />
  )
}
