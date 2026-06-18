import {AddIcon} from '@sanity/icons'
import {Box, Button, Card, Dialog, Spinner, Stack, Text} from '@sanity/ui'
import {FormEvent, useCallback, useEffect, useId, useRef, useState} from 'react'
import {useSchema} from 'sanity'

import {IndexState, NamedIndex} from '../api/embeddingsApi'
import {useApiClient} from '../api/embeddingsApiHooks'
import {useDefaultIndex} from './hooks'
import {IndexFormInput} from './IndexFormInput'

export function EditIndexDialog(props: {
  open: boolean
  onClose: () => void
  onSubmit: (index: IndexState) => void
}) {
  const {open, onClose, onSubmit} = props
  const id = useId()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    setTimeout(() => ref.current?.querySelector('input')?.focus())
  }, [ref, open])

  const handleSubmit = useCallback(
    (index: IndexState) => {
      onSubmit(index)
      onClose()
    },
    [onSubmit, onClose],
  )

  return open ? (
    <Dialog id={id} width={1} ref={ref} onClose={onClose} header="Create embeddings index">
      <Stack padding={4} space={5}>
        <IndexEditor readOnly={false} onSubmit={handleSubmit} />
      </Stack>
    </Dialog>
  ) : null
}

export function IndexEditor(props: {
  index?: Partial<NamedIndex>
  readOnly: boolean
  onSubmit?: (index: IndexState) => void
}) {
  const {readOnly, index: selectedIndex, onSubmit} = props
  const client = useApiClient()
  const schema = useSchema()
  const defaultIndex = useDefaultIndex(schema, client.config().dataset ?? '')
  const [errors, setErrors] = useState<string[] | undefined>()
  const [loading, setLoading] = useState<boolean>()
  const [index, setIndex] = useState<Partial<NamedIndex>>(() => ({
    ...defaultIndex,
    ...selectedIndex,
  }))

  useEffect(() => setIndex(selectedIndex ?? {...defaultIndex}), [selectedIndex, defaultIndex])

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      if (readOnly) {
        return
      }

      const validationErrors: string[] = []

      if (!index.indexName) {
        validationErrors.push('Index name is required')
      } else if (!index.indexName.match(/^[a-zA-Z0-9-_]+$/g)) {
        validationErrors.push('Index name can only contain the letters a-z, numbers - and _')
      }

      if (!index.dataset) {
        validationErrors.push('Dataset is required')
      }

      if (!index.filter) {
        validationErrors.push('Filter is required')
      }

      if (!index.projection) {
        validationErrors.push('Projection is required')
      }

      if (validationErrors.length) {
        setErrors(validationErrors)
        return
      }

      const {projectId} = client.config()
      setLoading(true)
      client
        .request({
          method: 'POST',
          url: `/embeddings-index/${index.dataset}?projectId=${projectId}`,
          body: {
            indexName: index.indexName,
            projection: index.projection,
            filter: index.filter,
          },
        })
        .then((response: {index: IndexState}) => {
          if (onSubmit) {
            onSubmit(response.index)
          }
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .catch((err: any) => {
          console.error(err)
          setErrors([err.message])
        })
        .finally(() => {
          setLoading(false)
        })
    },
    [index, readOnly, onSubmit, client],
  )

  return (
    <form onSubmit={handleSubmit}>
      <Stack space={4}>
        {errors?.length ? (
          <Card tone="critical" border padding={2}>
            <Text>
              <ul style={{marginLeft: -10}}>
                {/* eslint-disable-next-line react/no-array-index-key */}
                {errors?.map((error, i) => <li key={`${error}-${i}`}>{error}</li>)}
              </ul>
            </Text>
          </Card>
        ) : null}
        <IndexFormInput
          label="Index name"
          placeholder={'Name of index without spaces...'}
          index={index}
          prop="indexName"
          onChange={setIndex}
          readOnly={readOnly}
        />
        <IndexFormInput label="Dataset" index={index} prop="dataset" onChange={setIndex} readOnly />
        <IndexFormInput
          label="Filter"
          description="Must be a valid GROQ filter"
          placeholder={defaultIndex.filter}
          index={index}
          prop="filter"
          onChange={setIndex}
          readOnly={readOnly}
          type="textarea"
        />
        <IndexFormInput
          label="Projection"
          description="Must be a valid GROQ projection, starting { and ending with }"
          placeholder={defaultIndex.projection}
          index={index}
          prop="projection"
          onChange={setIndex}
          readOnly={readOnly}
          type="textarea"
        />
        {onSubmit && (
          <Button
            type="submit"
            text="Create index"
            icon={
              loading ? (
                <Box style={{marginTop: 5}}>
                  <Spinner />
                </Box>
              ) : (
                AddIcon
              )
            }
            disabled={readOnly || loading}
            tone="primary"
          />
        )}
      </Stack>
    </form>
  )
}
