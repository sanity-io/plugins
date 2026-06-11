import {
  ThemeProvider,
  ToastProvider,
  Stack,
  Text,
  Layer,
  Box,
  Card,
  Flex,
  Spinner,
} from '@sanity/ui'
import {randomKey} from '@sanity/util/content'
import {useMemo} from 'react'
import type {SanityDocument} from 'sanity'
import {useSchema} from 'sanity'

import {useClient} from '../hooks/useClient'
import {useSecrets} from '../hooks/useSecrets'
import type {Secrets, TranslationsTabConfigOptions} from '../types'
import {TranslationContext} from './TranslationContext'
import {TranslationView} from './TranslationView'

type TranslationTabProps = {
  document: {
    displayed: SanityDocument
  }
  options: TranslationsTabConfigOptions
}

const TranslationTab = (props: TranslationTabProps) => {
  const {displayed} = props.document
  const client = useClient()
  const schema = useSchema()

  const documentId = displayed?._id?.split('drafts.').pop() ?? ''

  const {errors, importTranslation, exportForTranslation} = useMemo(() => {
    const {
      serializationOptions,
      baseLanguage,
      languageField,
      mergeWithTargetLocale,
      newMetadataFormat,
    } = props.options
    const ctx = {
      client,
      schema,
    }

    const allErrors = []

    const importTranslationFunc = props.options.importTranslation
    if (!importTranslationFunc) {
      allErrors.push({
        key: randomKey(12),
        text: (
          <>
            You need to provide an <code>importTranslation</code> function. See documentation.
          </>
        ),
      })
    }

    const contextImportTranslation = (localeId: string, doc: string) => {
      return importTranslationFunc(
        documentId,
        localeId,
        doc,
        ctx,
        baseLanguage,
        serializationOptions,
        languageField,
        mergeWithTargetLocale,
        newMetadataFormat,
      )
    }

    const exportTranslationFunc = props.options.exportForTranslation
    if (!exportTranslationFunc) {
      allErrors.push({
        key: randomKey(12),
        text: (
          <>
            You need to provide an <code>exportForTranslation</code> function. See documentation.
          </>
        ),
      })
    }

    const contextExportForTranslation = (id: string) => {
      return exportTranslationFunc(id, ctx, baseLanguage, serializationOptions, languageField)
    }

    return {
      errors: allErrors,
      importTranslation: contextImportTranslation,
      exportForTranslation: contextExportForTranslation,
    }
  }, [props.options, documentId, client, schema])

  const {loading, secrets} = useSecrets<Secrets>(
    `${props.options.secretsNamespace || 'translationService'}.secrets`,
  )

  const contextValue = useMemo(
    () =>
      secrets
        ? {
            documentId,
            secrets,
            importTranslation,
            exportForTranslation,
            adapter: props.options.adapter,
            baseLanguage: props.options.baseLanguage,
            workflowOptions: props.options.workflowOptions,
            localeIdAdapter: props.options.localeIdAdapter,
            callbackUrl: props.options.callbackUrl,
            mergeWithTargetLocale: props.options.mergeWithTargetLocale,
            importAllConcurrency: props.options.importAllConcurrency ?? 10,
          }
        : null,
    [
      documentId,
      secrets,
      importTranslation,
      exportForTranslation,
      props.options.adapter,
      props.options.baseLanguage,
      props.options.workflowOptions,
      props.options.localeIdAdapter,
      props.options.callbackUrl,
      props.options.mergeWithTargetLocale,
      props.options.importAllConcurrency,
    ],
  )

  const hasErrors = errors.length > 0

  if (loading) {
    return (
      <ThemeProvider>
        <Flex padding={5} align="center" justify="center">
          <Spinner />
        </Flex>
      </ThemeProvider>
    )
  }

  if (!secrets) {
    return (
      <ThemeProvider>
        <Box padding={4}>
          <Card tone="caution" padding={[2, 3, 4, 4]} shadow={1} radius={2}>
            <Text>
              Can't find secrets for your translation service. Did you load them into this dataset?
            </Text>
          </Card>
        </Box>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <Box padding={4}>
        <Layer>
          <ToastProvider paddingY={7}>
            {hasErrors && (
              <Stack gap={3}>
                {errors.map((error) => (
                  <Card key={error.key} tone="caution" padding={[2, 3, 4, 4]} shadow={1} radius={2}>
                    <Text>{error.text}</Text>
                  </Card>
                ))}
              </Stack>
            )}
            {!hasErrors && contextValue && (
              <TranslationContext.Provider value={contextValue}>
                <TranslationView />
              </TranslationContext.Provider>
            )}
          </ToastProvider>
        </Layer>
      </Box>
    </ThemeProvider>
  )
}

export default TranslationTab
