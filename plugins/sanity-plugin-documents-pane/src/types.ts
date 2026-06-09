import type {ComponentProps} from 'react'
import type {ListenQueryOptions} from 'sanity'
import type {UserViewComponent} from 'sanity/structure'

export type DocumentVersionsCollection = ComponentProps<UserViewComponent>['document']

export type DocumentsPaneQueryParamsObject = Record<string, string>

export type DocumentsPaneQueryParamsFn = (params: {
  document: DocumentVersionsCollection
}) => Record<string, string> | null | undefined

export type DocumentsPaneQueryParams = DocumentsPaneQueryParamsObject | DocumentsPaneQueryParamsFn

export interface DocumentsPaneInitialValueTemplate {
  schemaType: string
  template?: string
  parameters?: Record<string, string | number | boolean>
  title: string
}

export type DocumentsPaneInitialValueTemplateResolver = (params: {
  document: DocumentVersionsCollection
}) => DocumentsPaneInitialValueTemplate[]

export type DocumentsPaneOptions = {
  query: string
  params?: DocumentsPaneQueryParams
  debug?: boolean
  useDraft?: boolean
  initialValueTemplates?: DocumentsPaneInitialValueTemplateResolver
  options?: ListenQueryOptions
  duplicate?: boolean
}

export type DocumentsPaneProps = ComponentProps<UserViewComponent<DocumentsPaneOptions>>
