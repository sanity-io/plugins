import {SanityClient} from 'sanity'

import {ExperimentType, GrowthbookFeature, VariantType} from '../types'
import {namespace, pluginConfigKeys} from './Components/Secrets'
import {GrowthbookExperimentFieldPluginConfig} from './types'

const getBooleanConversion = (value: string) => {
  // control is false
  if (value === 'true') {
    return 'variant'
  } else if (value === 'false') {
    return 'control'
  }
  return value
}

export const getExperiments = async ({
  client,
  environment,
  baseUrl,
  project,
  convertBooleans,
  tags,
}: Omit<GrowthbookExperimentFieldPluginConfig, 'fields' | 'baseUrl'> & {
  client: SanityClient
  baseUrl: string
}): Promise<ExperimentType[]> => {
  const query = `*[_id == 'secrets.${namespace}'][0].secrets.${pluginConfigKeys[0].key}`

  const secret = await client.fetch(query) // secret is stored in the content lake using @sanity/studio-secrets
  if (!secret) return []

  const featureExperiments: ExperimentType[] = []
  let hasMore = true
  let offset = 0
  const url = new URL(`${baseUrl}/features`)
  if (project) {
    url.searchParams.set('projectId', project)
  }

  while (hasMore) {
    url.searchParams.set('offset', offset.toString())
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${secret}`,
      },
    })

    const {features, hasMore: responseHasMore, nextOffset} = await response.json()

    hasMore = responseHasMore
    offset = nextOffset
    if (!features) continue

    features.forEach((feature: GrowthbookFeature) => {
      if (feature.archived) {
        return undefined
      }
      if (tags && feature.tags && !feature.tags.some((tag) => tags.includes(tag))) {
        return undefined
      }

      const experiments = feature.environments[environment]?.rules.filter(
        (experiment) => experiment.type === 'experiment-ref' || experiment.type === 'experiment',
      )

      if (!experiments) {
        return undefined
      }

      const variations: VariantType[] = []
      const uniqueValues = new Set<string>()

      experiments.forEach((experiment) => {
        experiment?.variations.forEach((variant) => {
          const value = convertBooleans ? getBooleanConversion(variant.value) : variant.value
          if (!uniqueValues.has(value)) {
            uniqueValues.add(value)
            variations.push({
              id: value,
              label: value,
            })
          }
        })
      })
      const value = {id: feature.id, label: feature.id, variants: variations}

      featureExperiments.push(value)
      return undefined
    })
  }
  const sortedFeatureExperiments = featureExperiments.sort((a, b) => a.id.localeCompare(b.id))
  return sortedFeatureExperiments
}
