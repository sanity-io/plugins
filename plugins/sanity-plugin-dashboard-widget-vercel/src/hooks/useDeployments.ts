import {useQuery} from '@tanstack/react-query'

import {API_ENDPOINT_ALIASES, API_ENDPOINT_DEPLOYMENTS} from '../constants'
import {type Sanity, type Vercel} from '../types'
import fetcher from '../utils/fetcher'

type Options = {
  enabled?: boolean
}

// FNV-1a: lets a token change refetch without storing the token itself in the query cache
function fingerprint(value: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < value.length; i++) {
    hash = Math.imul(hash ^ value.charCodeAt(i), 0x01000193)
  }
  return (hash >>> 0).toString(36)
}

const useDeployments = (deploymentTarget: Sanity.DeploymentTargetConfig, options?: Options) => {
  const fetchUrl = fetcher(deploymentTarget)

  const {deployHook, deployLimit, name, projectId, teamId, token} = deploymentTarget
  const queryKey = [
    'vercel-deployments',
    {deployHook, deployLimit, name, projectId, teamId, token: fingerprint(token)},
  ]

  // Fetch deployments
  const deployParams = new URLSearchParams()
  deployParams.set('limit', String(deploymentTarget?.deployLimit))

  const {
    data: deploymentsData,
    isFetching: deploymentsIsFetching,
    isSuccess: deploymentsIsSuccess,
    error: deploymentsError,
    refetch,
  } = useQuery<{deployments: Vercel.Deployment[]}>({
    queryKey,
    queryFn: () => fetchUrl(API_ENDPOINT_DEPLOYMENTS, deployParams),
    enabled: options?.enabled ?? true,
    refetchInterval: 20000, // ms
    refetchIntervalInBackground: false,
    refetchOnMount: true,
    refetchOnReconnect: 'always',
    refetchOnWindowFocus: false,
    retry: false,
  })

  // Fetch aliases (only if deployments have been retrieved)
  const aliasParams = new URLSearchParams()
  aliasParams.set('limit', '20')

  const {
    data: aliasesData,
    isFetching: aliasesIsFetching,
    isSuccess: aliasesIsSuccess,
    error: aliasesError,
  } = useQuery<{
    aliases: Vercel.Alias[]
    pagination: {
      count: number
      next?: number
      prev?: number
    }
  }>({
    queryKey: [...queryKey, 'aliases'],
    queryFn: () => fetchUrl(API_ENDPOINT_ALIASES, aliasParams),
    enabled: !!deploymentsData,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: false,
  })

  const aliases = aliasesData?.aliases

  let deploymentsWithAlias: Vercel.DeploymentWithAlias[] | undefined

  if (aliases) {
    deploymentsWithAlias = deploymentsData?.deployments?.map((val: Vercel.DeploymentWithAlias) => {
      const alias = aliases.find((a) => a.deploymentId === val.uid)
      return Object.assign(val, {alias: alias?.alias})
    })
  }

  return {
    deployments: deploymentsWithAlias,
    error: aliasesError || deploymentsError,
    isFetching: aliasesIsFetching || deploymentsIsFetching,
    isSuccess: aliasesIsSuccess && deploymentsIsSuccess,
    refetch,
  }
}

export default useDeployments
