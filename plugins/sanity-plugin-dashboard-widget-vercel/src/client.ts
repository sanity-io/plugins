import type {SanityClient} from '@sanity/client'
import {useClient} from 'sanity'

import {API_VERSION} from './constants'

export function useSanityClient(): SanityClient {
  return useClient({apiVersion: API_VERSION})
}
