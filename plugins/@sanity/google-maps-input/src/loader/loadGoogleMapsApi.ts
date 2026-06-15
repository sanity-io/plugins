declare global {
  // eslint-disable-next-line
  interface Window {
    gm_authFailure: any
    ___sanity_googleMapsApiCallback: any
  }
}

const callbackName = '___sanity_googleMapsApiCallback'
const authFailureCallbackName = 'gm_authFailure'

export class AuthError extends Error {}

function _loadGoogleMapsApi(config: {locale: string; apiKey: string}) {
  return new Promise<typeof window.google.maps>((resolve, reject) => {
    window[authFailureCallbackName] = () => {
      reject(new AuthError('Authentication error when loading Google Maps API.'))
    }

    window[callbackName] = () => {
      resolve(window.google.maps)
    }

    const script = document.createElement('script')
    script.onerror = (
      event: Event | string,
      source?: string,
      lineno?: number,
      colno?: number,
      error?: Error,
    ) => reject(new Error(coeerceError(event, error)))

    script.src = `https://maps.googleapis.com/maps/api/js?key=${config.apiKey}&libraries=places&callback=${callbackName}&language=${config.locale}`
    document.getElementsByTagName('head')[0].appendChild(script)
  }).finally(() => {
    delete window[callbackName]
    delete window[authFailureCallbackName]
  })
}

let memo: Promise<typeof window.google.maps> | null = null
export function loadGoogleMapsApi(config: {
  locale: string
  apiKey: string
}): Promise<typeof window.google.maps> {
  if (memo) {
    return memo
  }
  memo = _loadGoogleMapsApi(config)
  memo.catch(() => {
    memo = null
  })
  return memo
}
function coeerceError(event: Event | string, error?: Error): string {
  if (error) {
    return error.message
  }

  if (typeof event === 'string') {
    return event
  }

  return isErrorEvent(event) ? event.message : 'Failed to load Google Maps API'
}

function isErrorEvent(event: unknown): event is ErrorEvent {
  if (typeof event !== 'object' || event === null) {
    return false
  }

  if (!('message' in event)) {
    return false
  }

  return typeof (event as ErrorEvent).message === 'string'
}
