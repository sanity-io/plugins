// oxlint-disable typescript/no-unsafe-type-assertion - legacy code will be lint-cleaned in a follow-up PR
import pkg from '../../package.json'

interface RequestOptions {
  url: string
  as?: 'json'
  headers?: Record<string, string>
}

interface RequestResult<T> {
  body: T
}

/**
 * Tiny fetch wrapper matching the previous get-it requester shape used by
 * `getSanityUserInfo`.
 */
export async function requester<T>({url, headers = {}}: RequestOptions): Promise<RequestResult<T>> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': `${pkg.name}@${pkg.version}`,
      ...headers,
    },
  })

  if (!response.ok) {
    throw new Error(`Request to ${url} failed with status ${response.status}`)
  }

  return {body: (await response.json()) as T}
}
