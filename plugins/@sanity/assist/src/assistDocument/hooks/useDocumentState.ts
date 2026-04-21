import {useEditState} from 'sanity'

// oxlint-disable-next-line no-unnecessary-type-parameters
export function useDocumentState<T>(id: string, docType: string): T | undefined {
  const state = useEditState(id, docType)
  // oxlint-disable-next-line no-unsafe-type-assertion
  return (state.draft || state.published) as T | undefined
}
