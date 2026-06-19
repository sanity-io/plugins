import {ServerError} from '@sanity/client'

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed && !!parsed.protocol.match(/http:|https:/)
  } catch {
    return false
  }
}

/**
 * We consider a server error one with status code 5XX.
 * Used mainly to handle unknown Proxy issues.
 */
export function isServerError(error: Error): error is ServerError {
  return (
    'statusCode' in error &&
    typeof error.statusCode === 'number' &&
    500 <= error.statusCode &&
    error.statusCode <= 600
  )
}
