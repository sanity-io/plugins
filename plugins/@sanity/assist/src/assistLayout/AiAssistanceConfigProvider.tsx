import {type ReactNode, useCallback, useEffect, useMemo, useState} from 'react'
import {type ObjectSchemaType, type Schema, useSchema} from 'sanity'

import type {AssistPluginConfig} from '../plugin'
import {serializeSchema} from '../schemas/serialize/serializeSchema'
import {
  type InstructStatus,
  useApiClient,
  useGetInstructStatus,
  useInitInstruct,
} from '../useApiClient'
import {
  AiAssistanceConfigContext,
  type AiAssistanceConfigContextValue,
} from './AiAssistanceConfigContext'
import {createFieldRefCache} from './fieldRefCache'

export function AiAssistanceConfigProvider(props: {
  children?: ReactNode
  config: AssistPluginConfig
}) {
  const [status, setStatus] = useState<InstructStatus | undefined>()
  const [error, setError] = useState<Error | undefined>()

  const apiClient = useApiClient(props.config?.__customApiClient)
  const {getInstructStatus, loading: statusLoading} = useGetInstructStatus(apiClient)
  const {initInstruct, loading: initLoading} = useInitInstruct(apiClient)

  const schema = useSchema()
  const serializedTypes = useMemo(() => serializeSchema(schema, {leanFormat: true}), [schema])
  const {getFieldRefs, getFieldRefsByTypePath} = useFieldRefGetters(schema)

  useEffect(() => {
    getInstructStatus()
      .then((s) => setStatus(s))
      .catch((e) => {
        console.error(e)
        // oxlint-disable-next-line no-unsafe-type-assertion
        setError(e as Error)
      })
  }, [getInstructStatus])

  const init = useCallback(async () => {
    setError(undefined)
    try {
      await initInstruct()
      const status = await getInstructStatus()
      setStatus(status)
    } catch (e) {
      console.error('Failed to init ai assistance', e)
      // oxlint-disable-next-line no-unsafe-type-assertion
      setError(e as Error)
    }
  }, [initInstruct, getInstructStatus, setStatus])

  const {config, children} = props
  const context = useMemo<AiAssistanceConfigContextValue>(() => {
    return {
      config,
      status,
      statusLoading,
      init,
      initLoading,
      error,
      serializedTypes,
      getFieldRefs,
      getFieldRefsByTypePath,
    }
  }, [
    config,
    status,
    init,
    statusLoading,
    initLoading,
    error,
    serializedTypes,
    getFieldRefs,
    getFieldRefsByTypePath,
  ])

  return (
    <AiAssistanceConfigContext.Provider value={context}>
      {children}
    </AiAssistanceConfigContext.Provider>
  )
}

function useFieldRefGetters(schema: Schema) {
  return useMemo(() => {
    const getForSchemaType = createFieldRefCache()

    function getRefsForType(documentType: string) {
      // oxlint-disable-next-line no-unsafe-type-assertion
      const schemaType = schema.get(documentType) as ObjectSchemaType | undefined
      if (!schemaType) {
        throw new Error(`Schema type "${documentType}" not found`)
      }
      return getForSchemaType(schemaType)
    }

    return {
      getFieldRefs: (documentType: string) => getRefsForType(documentType).fieldRefs,
      getFieldRefsByTypePath: (documentType: string) =>
        getRefsForType(documentType).fieldRefsByTypePath,
    }
  }, [schema])
}
