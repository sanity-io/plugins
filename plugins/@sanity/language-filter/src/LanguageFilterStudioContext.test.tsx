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

    const {result, rerender} = renderHook(() => useLanguageFilterStudioContext(), {
      wrapper: createContextWrapper(options),
    })

    // Until the languages resolve, nothing is selectable and nothing is selected.
    expect(result.current.options.supportedLanguages).toEqual([])
    expect(result.current.selectedLanguageIds).toEqual([])

    await waitFor(() => {
      expect(result.current.options.supportedLanguages).toEqual(languages)
      expect(result.current.selectedLanguageIds).toEqual(['en', 'es'])
    })

    // The languages are resolved once per provider, not once per render.
    rerender()
    rerender()
    expect(supportedLanguages).toHaveBeenCalledTimes(1)
    expect(result.current.selectedLanguageIds).toEqual(['en', 'es'])
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

  it('keeps the selection made in this session over the persisted one', async () => {
    const options: Required<LanguageFilterConfig> = {
      ...defaultContextValue.options,
      supportedLanguages: [
        {id: 'en', title: 'English'},
        {id: 'fr', title: 'French'},
      ],
      defaultLanguages: ['en'],
    }

    const {result, rerender} = renderHook(() => useLanguageFilterStudioContext(), {
      wrapper: createContextWrapper(options),
    })

    await waitFor(() => {
      expect(result.current.selectedLanguageIds).toEqual(['en', 'fr'])
    })

    // Deriving from storage again would put the default language back in front.
    act(() => {
      result.current.setSelectedLanguageIds(['fr'])
    })
    rerender()

    expect(result.current.selectedLanguageIds).toEqual(['fr'])
    expect(window.localStorage.getItem('@sanity/plugin/language-filter/selected-languages')).toBe(
      '["fr"]',
    )
  })

  it('falls back to no selectable languages when language resolution fails', async () => {
    const supportedLanguages = vi.fn(async (): Promise<Language[]> => {
      throw new Error('boom')
    })

    const options: Required<LanguageFilterConfig> = {
      ...defaultContextValue.options,
      supportedLanguages,
      defaultLanguages: ['en'],
    }

    const {result} = renderHook(() => useLanguageFilterStudioContext(), {
      wrapper: createContextWrapper(options),
    })

    await waitFor(() => {
      expect(supportedLanguages).toHaveBeenCalledTimes(1)
    })
    // Let the rejection reach the subscription; without `catchError` it would surface here.
    await act(async () => {
      await supportedLanguages.mock.results[0]?.value.catch(() => {})
    })

    expect(result.current.options.supportedLanguages).toEqual([])
    expect(result.current.selectedLanguageIds).toEqual([])
  })
})
