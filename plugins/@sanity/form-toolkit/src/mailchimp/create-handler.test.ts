import {afterEach, expect, test, vi} from 'vitest'

import {fetchMailchimpData} from './create-handler'

afterEach(() => {
  vi.unstubAllGlobals()
})

test('fetches the signup forms of every list', async () => {
  const fetchMock = vi.fn(async (url: string) => {
    if (url.endsWith('/lists')) {
      return Response.json({
        lists: [
          {id: 'list-a', name: 'A'},
          {id: 'list-b', name: 'B'},
        ],
      })
    }
    const listId = url.split('/').at(-2)
    return Response.json({
      signup_forms: [{signup_form_url: `https://eepurl.com/${listId}`}],
    })
  })
  vi.stubGlobal('fetch', fetchMock)

  await expect(fetchMailchimpData({key: 'secret-us6', server: 'us6'})).resolves.toEqual([
    {
      list: {id: 'list-a', name: 'A'},
      form: {signup_form_url: 'https://eepurl.com/list-a'},
      value: 'https://eepurl.com/list-a',
    },
    {
      list: {id: 'list-b', name: 'B'},
      form: {signup_form_url: 'https://eepurl.com/list-b'},
      value: 'https://eepurl.com/list-b',
    },
  ])
  expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
    'https://us6.api.mailchimp.com/3.0/lists',
    'https://us6.api.mailchimp.com/3.0/lists/list-a/signup-forms',
    'https://us6.api.mailchimp.com/3.0/lists/list-b/signup-forms',
  ])
  expect(fetchMock).toHaveBeenCalledWith(expect.any(String), {
    headers: {Authorization: `Basic ${btoa('anystring:secret-us6')}`},
  })
})

test('throws with the Mailchimp error detail', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      Response.json(
        {title: 'API Key Invalid', status: 401, detail: 'Your API key may be invalid.'},
        {status: 401},
      ),
    ),
  )

  await expect(fetchMailchimpData({key: 'bad', server: 'us6'})).rejects.toThrow(
    'Mailchimp request to /lists failed with status 401: Your API key may be invalid.',
  )
})
