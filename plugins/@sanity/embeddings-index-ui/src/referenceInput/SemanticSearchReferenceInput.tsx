import {EarthGlobeIcon, LinkIcon} from '@sanity/icons'
import {Box, Button, Flex, Spinner} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
  ObjectInputProps,
  ReferenceBaseOptions,
  ReferenceSchemaType,
  set,
  setIfMissing,
  unset,
} from 'sanity'
import {useDocumentPane} from 'sanity/desk'

import {QueryResult} from '../api/embeddingsApi'
import {FeatureDisabledNotice, FeatureError, useIsFeatureEnabledContext} from '../api/isEnabled'
import {EmbeddingsIndexConfig} from '../schemas/typeDefExtensions'
import {publicId} from '../utils/id'
import {SemanticSearchAutocomplete} from './SemanticSearchAutocomplete'

function useEmeddingsConfig(
  embeddingsIndexConfig: ReferenceBaseOptions['embeddingsIndex'],
  defaultConfig: EmbeddingsIndexConfig | undefined,
) {
  return useMemo(() => {
    if (embeddingsIndexConfig === true || !embeddingsIndexConfig) {
      if (!defaultConfig?.indexName) {
        throw new Error(
          'Default embeddingsIndex config is missing. When options.embeddingsIndex: true, embeddingsIndexReferenceInput plugin config is required.',
        )
      }
      return defaultConfig
    }

    const finalConfig = {
      ...defaultConfig,
      ...embeddingsIndexConfig,
    }

    if (!finalConfig?.indexName) {
      throw new Error(
        'indexName is missing. Either set it in options.embeddingsIndex or configure defaults using plugin config.',
      )
    }

    return finalConfig
  }, [defaultConfig, embeddingsIndexConfig])
}

export function SemanticSearchReferenceInput(
  props: ObjectInputProps & {defaultConfig?: EmbeddingsIndexConfig},
) {
  const embeddingsIndexConfig = (props.schemaType as ReferenceSchemaType)?.options?.embeddingsIndex

  const config = useEmeddingsConfig(embeddingsIndexConfig, props.defaultConfig)

  const defaultEnabled = config.searchMode === 'embeddings'

  const featureState = useIsFeatureEnabledContext()

  const [semantic, setSemantic] = useState<boolean>(defaultEnabled)
  const toggleSemantic = useCallback(() => setSemantic((current) => !current), [])

  return (
    <Flex gap={2} flex={1} style={{width: '100%'}}>
      {semantic && featureState == 'loading' ? (
        <Box padding={2}>
          <Spinner />
        </Box>
      ) : null}

      {semantic && featureState == 'disabled' ? (
        <FeatureDisabledNotice urlSuffix="?ref=embeddings-ref" />
      ) : null}

      {semantic && featureState === 'error' ? (
        <Box padding={4}>
          <FeatureError />
        </Box>
      ) : null}

      <Box flex={1} style={{maxHeight: 36, overflow: 'hidden'}}>
        {semantic && featureState == 'enabled' ? (
          <SemanticSearchInput {...props} indexConfig={config} />
        ) : (
          props.renderDefault(props)
        )}
      </Box>
      <Button
        icon={semantic ? EarthGlobeIcon : LinkIcon}
        onClick={toggleSemantic}
        mode="bleed"
        title={
          semantic ? 'Switch to standard reference search' : 'Switch to semantic reference search'
        }
      />
    </Flex>
  )
}

function SemanticSearchInput(props: ObjectInputProps & {indexConfig: EmbeddingsIndexConfig}) {
  const {indexConfig, onPathFocus, onChange, readOnly, schemaType, value} = props

  const {value: currentDocument} = useDocumentPane()
  const docRef = useRef(currentDocument)
  const autocompleteRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    docRef.current = currentDocument
  }, [currentDocument])

  useEffect(() => {
    // if this component is rendered, and there is a value, replace was selected
    if (value?._ref) {
      autocompleteRef.current?.focus()
    }
    // intentional empty deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFocus = useCallback(() => onPathFocus(['_ref']), [onPathFocus])
  const handleBlur = useCallback(() => onPathFocus([]), [onPathFocus])

  const handleChange = useCallback(
    (result: QueryResult) => {
      if (!result) {
        onChange(unset())
        onPathFocus([])
        return
      }
      const patches = [
        setIfMissing({}),
        set(schemaType.name, ['_type']),
        set(publicId(result.value.documentId), ['_ref']),
        unset(['_weak']),
        unset(['_strengthenOnPublish']),
      ]

      onChange(patches)
      // Move focus away from _ref and one level up
      onPathFocus([])
    },
    [onChange, onPathFocus, schemaType.name],
  )

  const filterResult = useCallback(
    (r: QueryResult) => r.value.documentId !== publicId(docRef.current._id),
    [docRef],
  )

  const getEmptySearchValue = useCallback(() => JSON.stringify(docRef.current), [docRef])
  const typeFilter = useMemo(
    () => (schemaType as ReferenceSchemaType).to.map((refType) => refType.name),
    [schemaType],
  )

  return (
    <SemanticSearchAutocomplete
      ref={autocompleteRef}
      typeFilter={typeFilter}
      indexConfig={indexConfig}
      onSelect={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      getEmptySearchValue={getEmptySearchValue}
      filterResult={filterResult}
      readOnly={readOnly}
    />
  )
}
