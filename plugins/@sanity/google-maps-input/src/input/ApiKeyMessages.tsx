import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Box, Card, Code, Flex, Stack, Text} from '@sanity/ui'
import type {ReactNode} from 'react'

const GET_API_KEY_URL = 'https://developers.google.com/maps/documentation/javascript/get-api-key'
const DEMO_KEY_URL = 'https://developers.google.com/maps/documentation/javascript/demo-key'

// The APIs the key needs access to for the input to work end to end.
const REQUIRED_APIS = [
  'Google Maps JavaScript API',
  'Google Static Maps API',
  'Google Places API (New)',
] as const

function RequiredApis() {
  return (
    <Box paddingLeft={3}>
      <Stack as="ul" gap={2}>
        {REQUIRED_APIS.map((api) => (
          <Text key={api} as="li" size={1} muted>
            {api}
          </Text>
        ))}
      </Stack>
    </Box>
  )
}

function MessageCard({
  tone,
  icon,
  title,
  children,
}: {
  tone: 'caution' | 'critical'
  icon: ReactNode
  title: string
  children: ReactNode
}) {
  return (
    <Card padding={4} radius={2} tone={tone} border>
      <Flex gap={3}>
        <Box flex="none">
          <Text size={3}>{icon}</Text>
        </Box>
        <Stack flex={1} gap={4}>
          <Text size={1} weight="semibold">
            {title}
          </Text>
          {children}
        </Stack>
      </Flex>
    </Card>
  )
}

/**
 * Shown when the plugin has not been given an API key. Explains how to provide
 * one in the plugin config and which Google APIs it needs.
 */
export function MissingApiKeyCard({typeTitle}: {typeTitle: string}) {
  return (
    <MessageCard tone="caution" icon={<WarningOutlineIcon />} title="Google Maps API key required">
      <Text size={1} muted>
        The {typeTitle} field uses Google Maps and needs an API key. Add one to the{' '}
        <code>googleMapsInput</code> plugin configuration:
      </Text>
      <Card padding={3} radius={2} tone="transparent" border overflow="auto">
        <Code size={1}>{`googleMapsInput({apiKey: 'your-api-key'})`}</Code>
      </Card>
      <Stack gap={3}>
        <Text size={1} muted>
          The key needs these APIs enabled:
        </Text>
        <RequiredApis />
      </Stack>
      <Text size={1} muted>
        <a href={GET_API_KEY_URL} target="_blank" rel="noopener noreferrer">
          Get an API key
        </a>
        {' · '}
        <a href={DEMO_KEY_URL} target="_blank" rel="noopener noreferrer">
          use a demo key to test
        </a>
      </Text>
    </MessageCard>
  )
}

/**
 * Shown when a key is configured but Google rejects the request (e.g. an
 * invalid/demo key, a restricted key, or one missing the required APIs).
 */
export function InvalidApiKeyCard() {
  return (
    <MessageCard tone="critical" icon={<ErrorOutlineIcon />} title="Map preview couldn’t load">
      <Text size={1} muted>
        The Google Maps API key was rejected. Check that it is a valid key — not a demo or
        placeholder key — that it is not restricted in a way that blocks this Studio’s URL, and that
        it has these APIs enabled:
      </Text>
      <RequiredApis />
    </MessageCard>
  )
}
