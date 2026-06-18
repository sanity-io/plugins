/* eslint-disable max-nested-callbacks */
import {Autocomplete, AutocompleteOpenButtonProps, Box, Button, Flex, Text} from '@sanity/ui'
import {
  FocusEventHandler,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import {typed} from 'sanity'

import {queryIndex, QueryResult} from '../api/embeddingsApi'
import {useApiClient} from '../api/embeddingsApiHooks'
import {DocumentPreview} from '../preview/DocumentPreview'
import {EmbeddingsIndexConfig} from '../schemas/typeDefExtensions'

export interface SemanticSearchAutocompleteProps {
  indexConfig: EmbeddingsIndexConfig
  getEmptySearchValue: () => string
  typeFilter?: string[]
  filterResult?: (hit: QueryResult) => boolean
  onSelect?: (value: QueryResult) => void
  onFocus?: FocusEventHandler<HTMLInputElement>
  onBlur?: FocusEventHandler<HTMLInputElement>
  readOnly?: boolean
}

interface Option {
  result: QueryResult
  value: string
}

const NO_RESULTS_VALUE = '' as const

interface NoResultOption {
  value: string
}

const NO_OPTIONS: NoResultOption[] = []
const NO_FILTER = () => true

export const SemanticSearchAutocomplete = forwardRef(function SemanticSearchAutocomplete(
  props: SemanticSearchAutocompleteProps,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ref: any,
) {
  const {
    indexConfig,
    filterResult,
    getEmptySearchValue,
    readOnly,
    onFocus,
    onBlur,
    onSelect,
    typeFilter,
  } = props
  const id = useId()
  const [query, setQuery] = useState('')
  const queryRef = useRef(query)
  const debouncedQuery = useDebouncedValue(query, 300)
  const prevDebouncedQuery = useRef(debouncedQuery)

  const [searching, setSearching] = useState(false)
  const [options, setOptions] = useState<Option[] | NoResultOption[]>(NO_OPTIONS)

  const client = useApiClient()

  const runIndexQuery = useCallback(
    (queryString: string) => {
      setSearching(true)
      const indexName = indexConfig?.indexName
      const maxResults = indexConfig?.maxResults

      if (!indexName) {
        throw new Error(`Reference option embeddingsIndex.indexName is required, but was missing`)
      }

      queryIndex(
        {
          query: queryString.trim().length ? queryString : (getEmptySearchValue() ?? ''),
          indexName,
          maxResults,
          filter: {
            type: typeFilter,
          },
        },
        client,
      )
        .then((result: QueryResult[]) => {
          if (queryRef.current === queryString) {
            setSearching(false)
            setOptions([])
            setOptions([])
            const resultOptions = result
              .filter((hit) => (filterResult ? filterResult(hit) : true))
              .map((r) => typed<Option>({result: r, value: r.value.documentId}))
            if (resultOptions.length) {
              setOptions(resultOptions)
            } else {
              setOptions([{value: NO_RESULTS_VALUE}])
            }
          }
        })
        .catch((e) => {
          if (queryRef.current === queryString) {
            setSearching(false)
          }
          throw e
        })
    },
    [client, indexConfig, getEmptySearchValue, filterResult, typeFilter],
  )

  useEffect(() => {
    if (prevDebouncedQuery.current !== debouncedQuery) {
      runIndexQuery(debouncedQuery)
    }
    prevDebouncedQuery.current = debouncedQuery
  }, [debouncedQuery, runIndexQuery])

  const openButtonConfig: AutocompleteOpenButtonProps = useMemo(
    () => ({onClick: () => runIndexQuery(queryRef.current)}),
    [runIndexQuery, queryRef],
  )

  const handleQueryChange = useCallback(
    (newValue: string | null) => {
      const newQuery = newValue ?? ''
      queryRef.current = newQuery
      setQuery(newQuery)
    },
    [setQuery],
  )

  const handleChange = useCallback(
    (value: string) => {
      if (value === NO_RESULTS_VALUE) {
        setOptions(NO_OPTIONS)
        return
      }
      const option = (options as Option[])
        .filter((r): r is Option => 'result' in r)
        .find((r) => r.result.value.documentId === value)
      if (option && onSelect) {
        onSelect(option.result)
      }
    },
    [onSelect, options],
  )

  return (
    <Autocomplete
      id={id}
      ref={ref}
      data-testid="semantic-autocomplete"
      placeholder="Type to search..."
      openButton={openButtonConfig}
      onFocus={onFocus}
      onChange={handleChange}
      loading={searching}
      onBlur={onBlur}
      readOnly={readOnly}
      filterOption={NO_FILTER}
      onQueryChange={handleQueryChange}
      options={options}
      renderOption={AutocompleteOption}
    />
  )
})

function AutocompleteOption(props: Option | NoResultOption) {
  if ('result' in props) {
    const value = props.result.value
    return (
      <Button mode="bleed" padding={1} style={{width: '100%'}}>
        <Flex gap={2} align="center">
          <Box flex={1}>
            <DocumentPreview documentId={value.documentId} schemaTypeName={value.type} />
          </Box>
          <Box padding={2}>
            <Text size={1} muted title={'Relevance'}>
              {Math.floor(props.result.score * 100)}%
            </Text>
          </Box>
        </Flex>
      </Button>
    )
  }

  return (
    <Button mode="bleed" padding={1} style={{width: '100%'}} disabled>
      <Flex gap={2} align="center">
        No results.
      </Flex>
    </Button>
  )
}

function useDebouncedValue<T>(value: T, ms: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value)
    }, ms)
    return () => clearTimeout(timeoutId)
  }, [value, ms])

  return debouncedValue
}
