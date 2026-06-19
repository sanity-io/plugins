import {createRequester, type RequestOptions} from 'get-it'

import pkg from '../../package.json'

const requester = createRequester({
  headers: {'User-Agent': `${pkg.name}@${pkg.version}`},
})

export async function request<T = unknown>(options: RequestOptions | string): Promise<T> {
  const response =
    typeof options === 'string'
      ? await requester<T>({url: options, as: 'json'})
      : await requester<T>({...options, as: 'json'})

  return response.body
}
