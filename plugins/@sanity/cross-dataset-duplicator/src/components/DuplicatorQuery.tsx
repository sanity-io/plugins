import {Button, Stack, Box, Label, Text, Card, Flex, Grid, Container, TextInput} from '@sanity/ui'
import {type SubmitEvent, useState} from 'react'
import {useSchema, useClient, type SanityDocument} from 'sanity'

import type {PluginConfig} from '../types'
import Duplicator from './Duplicator'

type DuplicatorQueryProps = {
  token: string
  pluginConfig: Required<PluginConfig>
}

type InitialData = {
  docs: SanityDocument[]
}

export default function DuplicatorQuery(props: DuplicatorQueryProps) {
  const {token, pluginConfig} = props

  const {queries: preDefinedQueries, apiVersion} = pluginConfig
  const originClient = useClient({apiVersion})

  const schema = useSchema()
  const schemaTypes = schema.getTypeNames()

  const [value, setValue] = useState(``)
  const [fetched, setFetched] = useState(false)
  const [initialData, setInitialData] = useState<InitialData>({
    docs: [],
  })

  async function runQuery() {
    try {
      const res = await originClient.fetch<SanityDocument[]>(value)

      // Ensure queried docs are registered to the schema
      const registeredAndPublishedDocs = res.length
        ? res
            .filter((doc) => schemaTypes.includes(doc._type))
            .filter((doc) => !doc._id.startsWith(`drafts.`))
        : []

      setInitialData({
        docs: registeredAndPublishedDocs,
      })
      setFetched(true)
    } catch (err) {
      console.error(err)
    }
  }

  function handleSubmit(e?: SubmitEvent<HTMLFormElement>) {
    if (e) e.preventDefault()
    void runQuery()
  }

  return (
    <Card padding={[0, 0, 0, 5]}>
      <Container>
        <Grid gridTemplateColumns={[1, 1, 1, 2]} gap={[1, 1, 1, 4]}>
          <Box padding={[2, 2, 2, 0]}>
            <Card padding={4} radius={3} border>
              <Stack gap={4}>
                <Box>
                  <Label>Initial Documents Query</Label>
                </Box>
                <Box>
                  <Text>
                    Start with a valid GROQ query to load initial documents. The query will need to
                    return an Array of Objects. Drafts will be removed from the results.
                  </Text>
                </Box>
                <form onSubmit={handleSubmit}>
                  <Flex>
                    <Box flex={1} paddingRight={2}>
                      <TextInput
                        style={{fontFamily: 'monospace'}}
                        fontSize={2}
                        onChange={(event) => setValue(event.currentTarget.value)}
                        padding={4}
                        placeholder={`*[_type == "article"]`}
                        value={value ?? ``}
                      />
                    </Box>
                    <Button
                      padding={2}
                      paddingX={4}
                      tone="primary"
                      onClick={() => handleSubmit()}
                      text="Query"
                      disabled={!value}
                    />
                  </Flex>
                </form>
              </Stack>
            </Card>
            {preDefinedQueries && preDefinedQueries?.length > 0 && (
              <Card marginTop={2} padding={4} radius={3} border>
                <Box>
                  <Stack gap={4}>
                    <Box>
                      <Label>Predefined Queries</Label>
                    </Box>
                    <Stack gap={2}>
                      {preDefinedQueries.map((query) => (
                        <Button
                          key={query.label.replace(/\s+/g, '-')}
                          padding={2}
                          paddingX={4}
                          tone="primary"
                          onClick={() => setValue(`*[${query.query}]`)}
                          text={query.label}
                        />
                      ))}
                    </Stack>
                  </Stack>
                </Box>
              </Card>
            )}
          </Box>
          {fetched && initialData.docs.length < 1 && (
            <Container width={1}>
              <Card padding={5}>
                {value ? `No documents match this query` : `Start with a valid GROQ query`}
              </Card>
            </Container>
          )}
          {initialData.docs?.length > 0 && (
            <Duplicator docs={initialData.docs} token={token} pluginConfig={pluginConfig} />
          )}
        </Grid>
      </Container>
    </Card>
  )
}
