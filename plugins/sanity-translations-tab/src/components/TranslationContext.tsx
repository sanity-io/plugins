import React from 'react'
import type {SerializedDocument} from 'sanity-naive-html-serializer'

import type {Adapter, Secrets, WorkflowIdentifiers} from '../types'

export type ContextProps = {
  documentId: string
  adapter: Adapter
  importTranslation: (languageId: string, document: string) => Promise<void>
  exportForTranslation: (documentId: string) => Promise<SerializedDocument>
  baseLanguage: string
  secrets: Secrets
  workflowOptions?: WorkflowIdentifiers[]
  localeIdAdapter?: (id: string) => string | Promise<string>
  callbackUrl?: string
  mergeWithTargetLocale?: boolean
  importAllConcurrency?: number
}

export const TranslationContext = React.createContext<ContextProps | null>(null)
