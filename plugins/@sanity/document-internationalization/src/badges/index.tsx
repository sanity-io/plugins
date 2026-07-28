import type {DocumentBadgeDescription, DocumentBadgeProps} from 'sanity'

import {useDocumentInternationalizationContext} from '../components/DocumentInternationalizationContext'

/**
 * Document badge that displays the language identifier of a document.
 * Reads the configured `languageField` from the version, draft or published
 * document, looks up the matching language in `supportedLanguages` to resolve
 * the title, and returns a badge descriptor with `primary` color. Returns
 * `null` when no document exists or the language field is empty/non-string.
 */
export function LanguageBadge(props: DocumentBadgeProps): DocumentBadgeDescription | null {
  const source = props?.version || props?.draft || props?.published
  const {languageField, supportedLanguages} = useDocumentInternationalizationContext()
  const languageId = source?.[languageField]

  if (!languageId || typeof languageId !== 'string') {
    return null
  }

  const language = Array.isArray(supportedLanguages)
    ? supportedLanguages.find((l) => l.id === languageId)
    : null

  // Currently we only show the language id if the supportedLanguages are async
  return {
    label: language?.id ?? languageId,
    title: language?.title ?? undefined,
    color: `primary`,
  }
}
