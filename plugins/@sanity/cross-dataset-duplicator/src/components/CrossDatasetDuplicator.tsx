import {useSecrets, SettingsView} from '@sanity/studio-secrets'
import {Flex, Box, Spinner} from '@sanity/ui'
import type {SanityDocument} from 'sanity'

import {useCrossDatasetDuplicatorConfig} from '../context/ConfigProvider'
import {SECRET_NAMESPACE} from '../helpers/constants'
import DuplicatorQuery from './DuplicatorQuery'
import DuplicatorWrapper from './DuplicatorWrapper'
import Feedback from './Feedback'
import ResetSecret from './ResetSecret'

// Check for auth secret (required for asset uploads)
const secretConfigKeys = [
  {
    key: 'bearerToken',
    title:
      'An API token with Viewer permissions is required to duplicate the original files of assets, and will be used for all Duplications. Create one at sanity.io/manage',
    description: '',
  },
]

type Secrets = {
  bearerToken?: string
}

type CrossDatasetDuplicatorProps = {
  mode: 'tool' | 'action'
  docs: SanityDocument[]
  onDuplicated?: () => Promise<void>
}

export default function CrossDatasetDuplicator(props: CrossDatasetDuplicatorProps) {
  const {mode, docs, onDuplicated} = props
  const pluginConfig = useCrossDatasetDuplicatorConfig()

  const {loading, secrets} = useSecrets<Secrets>(SECRET_NAMESPACE)

  if (loading) {
    return (
      <Flex justify="center" align="center">
        <Box padding={5}>
          <Spinner />
        </Box>
      </Flex>
    )
  }

  // A bearer token is required to duplicate assets, so the prompt cannot be
  // dismissed until one is saved
  if (!secrets?.bearerToken) {
    return (
      <SettingsView
        title="Token Required"
        namespace={SECRET_NAMESPACE}
        keys={secretConfigKeys}
        onClose={() => null}
      />
    )
  }

  if (mode === 'tool' && pluginConfig) {
    return (
      <>
        <DuplicatorQuery token={secrets.bearerToken} pluginConfig={pluginConfig} />
        <ResetSecret apiVersion={pluginConfig.apiVersion} />
      </>
    )
  }

  if (!docs?.length) {
    return <Feedback>No docs passed into Duplicator Tool</Feedback>
  }

  if (!pluginConfig) {
    return <Feedback>No plugin config</Feedback>
  }

  return (
    <DuplicatorWrapper
      docs={docs}
      token={secrets.bearerToken}
      pluginConfig={pluginConfig}
      onDuplicated={onDuplicated}
    />
  )
}
