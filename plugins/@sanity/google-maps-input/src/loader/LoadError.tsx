import {Box, Card, Code, Stack, Text} from '@sanity/ui'

interface Props {
  error?: {message?: string}
  isAuthError: boolean
}

export function LoadError({error, isAuthError}: Props) {
  return (
    <Card tone="critical" radius={1}>
      <Box as="header" paddingX={4} paddingTop={4} paddingBottom={1}>
        <Text as="h2" weight="bold">
          Google Maps failed to load
        </Text>
      </Box>

      <Box paddingX={4} paddingTop={4} paddingBottom={1}>
        {isAuthError ? (
          <AuthError />
        ) : (
          <Stack space={3}>
            <Text as="h3" weight="semibold">
              Error details:
            </Text>
            <Card padding={3} radius={1} tone="critical" border>
              <Code size={1}>{error?.message || 'Unknown error'}</Code>
            </Card>
          </Stack>
        )}
      </Box>
    </Card>
  )
}

function AuthError() {
  return (
    <Stack space={3}>
      <Text>The error appears to be related to authentication</Text>
      <Text>Common causes include:</Text>
      <Stack as="ul" space={2} paddingLeft={4}>
        <Text as="li">Incorrect API key</Text>
        <Text as="li">Referer not allowed</Text>
        <Text as="li">Missing authentication scope</Text>
      </Stack>
      <Text>Check the browser developer tools for more information.</Text>
    </Stack>
  )
}
