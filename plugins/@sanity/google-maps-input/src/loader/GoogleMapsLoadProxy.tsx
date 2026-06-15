import {type ReactElement, useEffect, useState} from 'react'
import type {GoogleMapsInputConfig} from '../types'
import {AuthError, loadGoogleMapsApi} from './loadGoogleMapsApi'
import {LoadError as LoadErrorView} from './LoadError'

interface LoadProps {
  children: (api: typeof window.google.maps) => ReactElement
  config: GoogleMapsInputConfig
}

const browserLocale = (typeof window !== 'undefined' && window.navigator.language) || 'en'

type LoadState =
  | {
      type: 'loading'
    }
  | {
      type: 'loaded'
      api: typeof window.google.maps
    }
  | {
      type: 'error'
      error: {type: 'loadError' | 'authError'; message: string}
    }

function useLoadGoogleMapsApi(config: {defaultLocale?: string; apiKey: string}): LoadState {
  const locale = config.defaultLocale || browserLocale || 'en-US'

  const [state, setState] = useState<LoadState>({type: 'loading'})

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    loadGoogleMapsApi({locale, apiKey: config.apiKey}).then(
      (api) => setState({type: 'loaded', api}),
      (err) =>
        setState({
          type: 'error',
          error: {type: err instanceof AuthError ? 'authError' : 'loadError', message: err.message},
        }),
    )
  }, [locale, config.apiKey])
  return state
}

export function GoogleMapsLoadProxy(props: LoadProps) {
  const loadState = useLoadGoogleMapsApi(props.config)
  switch (loadState.type) {
    case 'error':
      return (
        <LoadErrorView error={loadState.error} isAuthError={loadState.error.type === 'authError'} />
      )
    case 'loading':
      return <div>Loading Google Maps API</div>
    case 'loaded':
      return props.children(loadState.api)
    default:
      return null
  }
}
