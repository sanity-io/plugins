import {Box, Label, Stack} from '@sanity/ui'
import {Code} from '@sanity/ui/code'

export default function Debug({query, params}: {query: string; params?: Record<string, string>}) {
  return (
    <>
      <Stack gap={4}>
        <Box>
          <Label>Query</Label>
        </Box>
        <Box>
          <Code>{query}</Code>
        </Box>
      </Stack>
      {params ? (
        <Stack gap={4}>
          <Box>
            <Label>Params</Label>
          </Box>
          <Box>
            <Code>{JSON.stringify(params)}</Code>
          </Box>
        </Stack>
      ) : null}
    </>
  )
}
