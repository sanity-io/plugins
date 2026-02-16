import {LockIcon} from '@sanity/icons'
import {SettingsView, useSecrets} from '@sanity/studio-secrets'
import {Box, Button, Card, Code, Heading, Stack, Text} from '@sanity/ui'
import {type ReactElement, useState} from 'react'
import {definePlugin} from 'sanity'

// Define a namespace for our secrets - this is the identifier used to store and retrieve secrets
const SECRETS_NAMESPACE = 'studioSecretsExample'

// Define the keys we want to store as secrets
const secretKeys = [
  {
    key: 'apiKey',
    title: 'API Key',
    description: 'Your secret API key for external service integration',
  },
  {
    key: 'webhookSecret',
    title: 'Webhook Secret',
    description: 'Secret used to verify webhook signatures',
  },
]

// Define the shape of our secrets
interface MySecrets {
  apiKey?: string
  webhookSecret?: string
}

// Component that demonstrates reading and managing secrets
function SecretsDemo(): ReactElement {
  const {secrets, loading} = useSecrets<MySecrets>(SECRETS_NAMESPACE)
  const [showSettings, setShowSettings] = useState(false)

  if (loading) {
    return (
      <Card padding={4}>
        <Text>Loading secrets...</Text>
      </Card>
    )
  }

  return (
    <Card padding={4}>
      <Stack space={5}>
        <Heading as="h1" size={2}>
          @sanity/studio-secrets Demo
        </Heading>

        <Text muted>
          This plugin provides React hooks and UI for reading and managing secrets in Sanity Studio.
          Secrets are stored securely in a document in your dataset that is not readable by external
          users.
        </Text>

        <Card border padding={4} radius={2} tone="primary">
          <Stack space={4}>
            <Heading as="h2" size={1}>
              Current Secrets
            </Heading>

            {secrets ? (
              <Stack space={3}>
                <Box>
                  <Text size={1} weight="semibold">
                    API Key:
                  </Text>
                  <Code size={1}>{secrets.apiKey ? '••••••••' : '(not set)'}</Code>
                </Box>
                <Box>
                  <Text size={1} weight="semibold">
                    Webhook Secret:
                  </Text>
                  <Code size={1}>{secrets.webhookSecret ? '••••••••' : '(not set)'}</Code>
                </Box>
              </Stack>
            ) : (
              <Text muted>No secrets configured yet.</Text>
            )}

            <Button
              icon={LockIcon}
              onClick={() => setShowSettings(true)}
              text="Configure Secrets"
              tone="primary"
            />
          </Stack>
        </Card>

        <Card border padding={4} radius={2} tone="caution">
          <Stack space={3}>
            <Heading as="h2" size={1}>
              Usage in Your Plugin
            </Heading>
            <Code language="typescript" size={1}>
              {`import {useSecrets, SettingsView} from '@sanity/studio-secrets'

const {secrets, loading} = useSecrets<MySecrets>('myNamespace')

// Show settings UI when needed
<SettingsView
  title="Configure Secrets"
  namespace="myNamespace"
  keys={[{key: 'apiKey', title: 'API Key'}]}
  onClose={() => setShowSettings(false)}
/>`}
            </Code>
          </Stack>
        </Card>
      </Stack>

      {showSettings && (
        <SettingsView
          title="Configure Secrets"
          namespace={SECRETS_NAMESPACE}
          keys={secretKeys}
          onClose={() => setShowSettings(false)}
        />
      )}
    </Card>
  )
}

// Export the plugin that adds a tool to demonstrate studio-secrets
export const studioSecretsExample = definePlugin(() => ({
  name: 'studio-secrets-example',
  tools: [
    {
      name: 'studio-secrets-demo',
      title: 'Secrets Demo',
      icon: LockIcon,
      component: SecretsDemo,
    },
  ],
}))
