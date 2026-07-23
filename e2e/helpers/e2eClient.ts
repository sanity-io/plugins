import {createClient, type SanityClient} from '@sanity/client'

import {sanityIdify} from './sanityIdify.js'

function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing required environment variable "${name}"`)
  }
  return value
}

export function createE2EClient(dataset: string): SanityClient {
  return createClient({
    projectId: requireEnv('SANITY_E2E_PROJECT_ID'),
    dataset: sanityIdify(dataset),
    token: requireEnv('SANITY_E2E_SESSION_TOKEN'),
    apiVersion: '2023-02-03',
    useCdn: false,
  })
}
