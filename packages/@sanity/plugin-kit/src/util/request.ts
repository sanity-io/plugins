import {createRequester} from 'get-it'

import pkg from '../../package.json'

export const requester = createRequester({
  headers: {'User-Agent': `${pkg.name}@${pkg.version}`},
  as: 'json',
})
