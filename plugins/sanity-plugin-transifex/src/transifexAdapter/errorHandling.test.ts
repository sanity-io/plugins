import type {Secrets} from 'sanity-translations-tab'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createTask} from './createTask'
import {getLocales} from './getLocales'
import {getTranslation} from './getTranslation'

const secrets: Secrets = {
  organization: 'org',
  project: 'project',
  token: 'token',
}

const createMockResponse = ({
  status = 200,
  json = {},
}: {
  status?: number
  json?: Record<string, any>
} = {}) => new Response(JSON.stringify(json), {status})

describe('transifex adapter error handling', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('throws a clear error when locales request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createMockResponse({status: 401})))

    await expect(getLocales(secrets)).rejects.toThrow(
      'Failed to retrieve locales from Transifex. Status: 401',
    )
  })

  it('throws when fetching existing resource fails with non-404 status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createMockResponse({status: 500})))

    await expect(
      createTask('doc-1', {name: 'Doc', content: 'Content'}, [], secrets),
    ).rejects.toThrow('Failed to retrieve Transifex resource. Status: 500')
  })

  it('throws when uploading resource strings fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(createMockResponse({status: 404}))
        .mockResolvedValueOnce(createMockResponse({json: {data: {id: 'resource-id'}}}))
        .mockResolvedValueOnce(createMockResponse({status: 500})),
    )

    await expect(
      createTask('doc-1', {name: 'Doc', content: 'Content'}, [], secrets),
    ).rejects.toThrow('Failed to upload resource strings to Transifex. Status: 500')
  })

  it('throws when creating async translation download fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createMockResponse({status: 403})))

    await expect(getTranslation('resource-id', 'es', secrets)).rejects.toThrow(
      'Failed to create translation download request in Transifex. Status: 403',
    )
  })

  it('stops polling after max retries', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(createMockResponse({json: {data: {id: 'download-id'}}}))
        .mockResolvedValue(createMockResponse({status: 500})),
    )

    const translationPromise = getTranslation('resource-id', 'es', secrets)
    const assertion = expect(translationPromise).rejects.toThrow(
      'Failed to retrieve download location for translation download ID download-id after 20 retries.',
    )
    await vi.runAllTimersAsync()
    await assertion
  })
})
