import {createContext, useCallback, useContext, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {catchError, defer, from, of} from 'rxjs'
import {type LayoutProps, useClient} from 'sanity'

import {defaultFilterField} from './filterField'
import {getPersistedLanguageIds, setPersistedLanguageIds} from './persistedLanguageIds'
import type {LanguageFilterConfig, LanguageFilterConfigProcessed, Language} from './types'

export interface LanguageFilterStudioContextProps {
  options: Required<LanguageFilterConfig>
}

export interface LanguageFilterStudioContextProcessed {
  options: Required<LanguageFilterConfigProcessed>
}

export interface LanguageFilterStudioContextValue extends LanguageFilterStudioContextProcessed {
  selectedLanguageIds: string[]
  setSelectedLanguageIds: (ids: string[]) => void
}

export const defaultContextValue: LanguageFilterStudioContextValue = {
  options: {
    apiVersion: '2022-11-27',
    supportedLanguages: [],
    defaultLanguages: [],
    documentTypes: [],
    filterField: defaultFilterField,
  },
  selectedLanguageIds: [],
  setSelectedLanguageIds: () => console.error('LanguageFilterStudioContext not initialized'),
}

const LanguageFilterStudioContext =
  createContext<LanguageFilterStudioContextValue>(defaultContextValue)

const INITIAL_VALUE: Language[] = []

/**
 * This is a separate Provider from the Context that wraps the document pane
 * but it used to listen to changes to the selected language IDs inside it
 * and provide them to a Studio-wide context
 */
export function LanguageFilterStudioProvider(
  props: LayoutProps & LanguageFilterStudioContextProps,
): React.JSX.Element {
  const client = useClient({apiVersion: '2023-01-01'})
  const supportedLanguages = props.options.supportedLanguages
  const defaultLanguages = props.options.defaultLanguages
  // Resolved once per provider: the callback form may fetch, and react-rx subscribes on commit
  // and re-subscribes whenever the observable identity changes.
  const [languages$] = useState(() =>
    Array.isArray(supportedLanguages)
      ? of(supportedLanguages)
      : defer(() => from(supportedLanguages(client, {}))).pipe(
          // If language resolution fails, keep the plugin operational with no selectable languages.
          catchError(() => of([])),
        ),
  )

  const languages = useObservable(languages$, INITIAL_VALUE)

  // The languages picked in this session, or `null` while the persisted selection still applies.
  const [sessionLanguageIds, setSessionLanguageIds] = useState<string[] | null>(null)
  // Derived from the resolved languages, so the persisted selection is scoped to them.
  const persistedLanguageIds = useMemo(
    () => getPersistedLanguageIds({supportedLanguages: languages, defaultLanguages}),
    [languages, defaultLanguages],
  )
  const selectedLanguageIds = sessionLanguageIds ?? persistedLanguageIds

  const options = useMemo<Required<LanguageFilterConfigProcessed>>(() => {
    return {
      ...defaultContextValue.options,
      ...props.options,
      supportedLanguages: languages,
    }
  }, [props.options, languages])

  const onSelectedLanguageIdsChange = useCallback((ids: string[]) => {
    setSessionLanguageIds(ids)
    setPersistedLanguageIds(ids)
  }, [])

  const value = useMemo(
    () => ({options, selectedLanguageIds, setSelectedLanguageIds: onSelectedLanguageIdsChange}),
    [options, selectedLanguageIds, onSelectedLanguageIdsChange],
  )

  return (
    <LanguageFilterStudioContext.Provider value={value}>
      {props.renderDefault(props)}
    </LanguageFilterStudioContext.Provider>
  )
}

/**
 * Retrieves plugin options and the currently selected
 * language IDs from anywhere in the Studio
 */
export function useLanguageFilterStudioContext(): LanguageFilterStudioContextValue {
  return useContext(LanguageFilterStudioContext)
}
