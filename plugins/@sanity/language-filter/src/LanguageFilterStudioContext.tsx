import {createContext, useCallback, useContext, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {catchError, defer, from, of, tap} from 'rxjs'
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
  const [selectedLanguageIds, setSelectedLanguageIds] = useState<string[]>([])
  const [languages$] = useState(() => {
    // We first resolve the languages from the callback or the array.
    const languagesObservable = Array.isArray(supportedLanguages)
      ? of(supportedLanguages)
      : defer(() => from(supportedLanguages(client, {}))).pipe(
          // If language resolution fails, keep the plugin operational with no selectable languages.
          catchError(() => of([])),
        )

    // After resolving the languages we can get the persisted languages by checking localStorage.
    return languagesObservable.pipe(
      tap((languages) => {
        const persistedLanguageIds = getPersistedLanguageIds({
          supportedLanguages: languages,
          defaultLanguages,
        })
        setSelectedLanguageIds(persistedLanguageIds)
      }),
    )
  })

  const languages = useObservable(languages$, INITIAL_VALUE)

  const options = useMemo<Required<LanguageFilterConfigProcessed>>(() => {
    return {
      ...defaultContextValue.options,
      ...props.options,
      supportedLanguages: languages,
    }
  }, [props.options, languages])

  const onSelectedLanguageIdsChange = useCallback((ids: string[]) => {
    setSelectedLanguageIds(ids)
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
