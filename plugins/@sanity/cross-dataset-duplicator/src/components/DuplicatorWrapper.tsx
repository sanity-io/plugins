import {Grid, Card, Container, Button} from '@sanity/ui'
import {useState, useEffect} from 'react'
import {type SanityDocument, useClient} from 'sanity'

import type {DuplicatorProps} from './Duplicator'
import Duplicator from './Duplicator'

export default function DuplicatorWrapper(props: DuplicatorProps) {
  const {docs, token, pluginConfig, onDuplicated} = props
  const [inbound, setInbound] = useState<SanityDocument[]>([])
  const {follow, apiVersion} = pluginConfig

  // Make the first mode the default if there's only one
  const [mode, setMode] = useState<'inbound' | 'outbound'>(
    follow.length === 1 ? (follow[0] ?? 'outbound') : 'outbound',
  )
  const client = useClient({apiVersion})

  // "Inbound" will start with all documents that reference the first one
  // And then you can gather "Outbound" references thereafter
  useEffect(() => {
    async function fetchInbound() {
      const firstDocId = docs[0]?._id

      if (!follow.includes(`inbound`) || !firstDocId) {
        return
      }

      const inboundReferences = await client.fetch<SanityDocument[]>(`*[references($id)]`, {
        id: firstDocId,
      })
      setInbound([...docs, ...inboundReferences])
    }

    fetchInbound().catch(console.error)
  }, [client, docs, follow])

  return (
    <Container>
      {follow.length > 1 && (follow.includes(`inbound`) || follow.includes(`outbound`)) ? (
        <Card paddingX={4} paddingBottom={4} marginBottom={4} borderBottom>
          <Grid gridTemplateColumns={2} gap={4}>
            {follow.includes(`outbound`) ? (
              <Button
                mode="ghost"
                tone="primary"
                selected={mode === 'outbound'}
                onClick={() => setMode('outbound')}
                text="Outbound"
              />
            ) : null}
            {follow.includes(`inbound`) ? (
              <Button
                mode="ghost"
                tone="primary"
                selected={mode === 'inbound'}
                onClick={() => setMode('inbound')}
                disabled={inbound.length === 0}
                text={inbound.length > 0 ? `Inbound (${inbound.length})` : 'No inbound references'}
              />
            ) : null}
          </Grid>
        </Card>
      ) : null}
      <Duplicator
        docs={mode === 'outbound' ? docs : inbound}
        token={token}
        pluginConfig={pluginConfig}
        onDuplicated={onDuplicated}
      />
    </Container>
  )
}
