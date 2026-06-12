import {SanityClient} from 'sanity'

import {ExperimentType} from '../types'
import {LaunchDarklyFieldLevelConfig, LaunchDarklyFlagItem} from './types'

export const getExperiments = async ({
  client,
  projectKey,
  tags,
}: Omit<LaunchDarklyFieldLevelConfig, 'fields'> & {client: SanityClient}): Promise<
  ExperimentType[]
> => {
  const query = `*[_id == 'secrets.launchdarkly'][0].secrets.apiKey`

  const secret = await client.fetch(query) // secret is stored in the content lake using @sanity/studio-secrets
  if (!secret) return []

  const url = new URL(`https://app.launchdarkly.com/api/v2/flags/${projectKey}`)

  if (tags) {
    url.searchParams.set('filter', `tags:${tags.join('+')}`)
  }

  const featureExperiments: ExperimentType[] = []
  let hasMore = true
  const offset = 0
  const limit = 10

  while (hasMore) {
    url.searchParams.set('offset', offset.toString())
    url.searchParams.set('limit', limit.toString())
    const responseFlags = await fetch(url, {
      headers: {
        Authorization: secret,
      },
    })

    const {items} = await responseFlags.json()
    const experiments = items.map((flag: LaunchDarklyFlagItem) => ({
      id: flag.key,
      label: flag.name,
      variants: flag.variations.map((variation) => ({
        id: variation.value.toString(),
        label: variation.name ?? variation.value.toString(),
      })),
    }))
    featureExperiments.push(...experiments)
    if (items.length !== limit) {
      hasMore = false
    }
  }

  return featureExperiments
}
