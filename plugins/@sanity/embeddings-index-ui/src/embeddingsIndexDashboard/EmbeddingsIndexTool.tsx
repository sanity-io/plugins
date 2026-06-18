import {AddIcon, UndoIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Heading, Spinner, Stack} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'

import {deleteIndex, getIndexes, IndexState, NamedIndex} from '../api/embeddingsApi'
import {useApiClient} from '../api/embeddingsApiHooks'
import {FeatureDisabledNotice, FeatureError, useIsFeatureEnabled} from '../api/isEnabled'
import {EditIndexDialog} from './IndexEditor'
import {IndexInfo} from './IndexInfo'
import {IndexList} from './IndexList'

export function EmbeddingsIndexTool() {
  const featureState = useIsFeatureEnabled()
  return (
    <Card flex={1}>
      <Flex justify="center" flex={1}>
        {featureState === 'error' ? (
          <Box padding={4}>
            <FeatureError />
          </Box>
        ) : null}

        {featureState === 'disabled' ? (
          <Box padding={4}>
            <FeatureDisabledNotice urlSuffix="?ref=embeddings-tab" />
          </Box>
        ) : null}

        {featureState === 'loading' ? (
          <Box padding={6}>
            <Spinner size={4} />
          </Box>
        ) : null}

        {featureState === 'enabled' ? (
          <Card flex={1} style={{maxWidth: 1200}} padding={5}>
            <Indexes />
          </Card>
        ) : null}
      </Flex>
    </Card>
  )
}

const NO_INDEXES: IndexState[] = []

function Indexes() {
  const client = useApiClient()
  const [indexes, setIndexes] = useState<IndexState[]>(NO_INDEXES)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [createIndexOpen, setCreateIndexOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<IndexState | undefined>(undefined)

  const onCreateIndexClose = useCallback(() => setCreateIndexOpen(false), [])

  useEffect(() => {
    setSelectedIndex(indexes.find((i) => i.indexName === selectedIndex?.indexName))
  }, [indexes, selectedIndex])

  const updateIndexes = useCallback(() => {
    setLoading(true)
    setError(false)
    getIndexes(client)
      .then((response: IndexState[]) => {
        setLoading(false)
        setIndexes(response)
      })
      .catch((e) => {
        // eslint-disable-next-line no-unused-expressions
        console.error(e)
        setError(true)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [client])

  const deleteNamedIndex = useCallback(
    (index: NamedIndex) => {
      if (
        // eslint-disable-next-line no-alert
        !confirm(`Are you sure you want to delete ${index.indexName} for dataset ${index.dataset}?`)
      ) {
        return
      }
      setLoading(true)
      setError(false)
      deleteIndex(index.indexName, client)
        .then(() => {
          setTimeout(() => updateIndexes())
        })
        .catch((e) => {
          // eslint-disable-next-line no-unused-expressions
          console.error(e)
          setError(true)
        })
        .finally(() => {
          setLoading(false)
        })
    },
    [client, updateIndexes],
  )

  const onSelectIndex = useCallback(
    (index: IndexState) => {
      setSelectedIndex(index)
      updateIndexes()
    },
    [setSelectedIndex, updateIndexes],
  )

  useEffect(() => {
    updateIndexes()
  }, [updateIndexes])

  const openCreate = useCallback(() => setCreateIndexOpen(true), [])
  const onSubmit = useCallback(
    (index: IndexState) => {
      setIndexes((current) => [...current, index])
      setSelectedIndex(index)
      updateIndexes()
    },
    [updateIndexes],
  )
  return (
    <Stack space={4}>
      <Flex gap={2} align="center" style={{height: 30}}>
        <Box flex={1}>
          <Heading size={1}>Embeddings indexes</Heading>
        </Box>
        <Box style={{justifySelf: 'flex-end'}}>
          <Button
            icon={AddIcon}
            text={'New index'}
            tone="default"
            mode="ghost"
            onClick={openCreate}
          />
        </Box>
        <Button
          size={1}
          icon={loading ? <Spinner /> : UndoIcon}
          title={'Refresh index list'}
          tone="default"
          mode="bleed"
          onClick={updateIndexes}
          disabled={loading}
        />
      </Flex>
      {error ? (
        <Card tone="critical" padding={2} border>
          An error occurred. See console for details.
        </Card>
      ) : null}
      <IndexList
        loading={loading}
        indexes={indexes}
        selectedIndex={selectedIndex}
        onIndexSelected={onSelectIndex}
      />
      {selectedIndex && (
        <IndexInfo selectedIndex={selectedIndex} onDeleteIndex={deleteNamedIndex} />
      )}
      <EditIndexDialog open={createIndexOpen} onClose={onCreateIndexClose} onSubmit={onSubmit} />
    </Stack>
  )
}
