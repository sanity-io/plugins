import {renderHook, waitFor, act} from '@testing-library/react'
import type {PropsWithChildren} from 'react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {
  defaultContextValue,
  LanguageFilterStudioProvider,
  useLanguageFilterStudioContext,
} from './LanguageFilterStudioContext'
import type {Language, LanguageFilterConfig} from './types'

vi.mock('sanity', () => ({
  useClient: vi.fn(),
}))

function createContextWrapper(options: Required<LanguageFilterConfig>) {
  return function Wrapper({children}: PropsWithChildren) {
    return <LanguageFilterStudioProvider renderDefault={() => <>{children}</>} options={options} />
  }
}

describe('LanguageFilterStudioProvider', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('hydrates selected languages after async language resolution', async () => {
    window.localStorage.setItem(
      '@sanity/plugin/language-filter/selected-languages',
      JSON.stringify(['es', 'de']),
    )

    const languages: Language[] = [
      {id: 'en', title: 'English'},
      {id: 'es', title: 'Spanish'},
      {id: 'fr', title: 'French'},
    ]
    const supportedLanguages = vi.fn(async () => languages)

    const options: Required<LanguageFilterConfig> = {
      ...defaultContextValue.options,
      supportedLanguages,
      defaultLanguages: ['en'],
    }

    const {result} = renderHook(() => useLanguageFilterStudioContext(), {
      wrapper: createContextWrapper(options),
    })

    await waitFor(() => {
      expect(result.current.options.supportedLanguages).toEqual(languages)
      expect(result.current.selectedLanguageIds).toEqual(['en', 'es'])
    })
  })

  it('hydrates selected languages when supportedLanguages is a static array', async () => {
    window.localStorage.setItem(
      '@sanity/plugin/language-filter/selected-languages',
      JSON.stringify(['es', 'de']),
    )

    const options: Required<LanguageFilterConfig> = {
      ...defaultContextValue.options,
      supportedLanguages: [
        {id: 'en', title: 'English'},
        {id: 'es', title: 'Spanish'},
        {id: 'fr', title: 'French'},
      ],
      defaultLanguages: ['en'],
    }

    const {result} = renderHook(() => useLanguageFilterStudioContext(), {
      wrapper: createContextWrapper(options),
    })

    await waitFor(() => {
      expect(result.current.options.supportedLanguages).toEqual([
        {id: 'en', title: 'English'},
        {id: 'es', title: 'Spanish'},
        {id: 'fr', title: 'French'},
      ])
      expect(result.current.selectedLanguageIds).toEqual(['en', 'es'])
    })
  })

  it('persists selected language ids when context setter is used', async () => {
    const options: Required<LanguageFilterConfig> = {
      ...defaultContextValue.options,
      supportedLanguages: [{id: 'en', title: 'English'}],
      defaultLanguages: [],
    }

    const {result} = renderHook(() => useLanguageFilterStudioContext(), {
      wrapper: createContextWrapper(options),
    })

    await waitFor(() => {
      expect(result.current.options.supportedLanguages).toEqual([{id: 'en', title: 'English'}])
    })

    act(() => {
      result.current.setSelectedLanguageIds(['en'])
    })

    await waitFor(() => {
      expect(window.localStorage.getItem('@sanity/plugin/language-filter/selected-languages')).toBe(
        '["en"]',
      )
      expect(result.current.selectedLanguageIds).toEqual(['en'])
    })
  })
})
