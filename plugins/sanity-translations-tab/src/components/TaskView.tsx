import {ArrowTopRightIcon} from '@sanity/icons'
import {Box, Button, Flex, Text, Stack, useToast} from '@sanity/ui'
import {useCallback, useContext, useState} from 'react'

import type {TranslationLocale, TranslationTask} from '../types'
import {LanguageStatus} from './LanguageStatus'
import {TranslationContext} from './TranslationContext'

type JobProps = {
  task: TranslationTask
  locales: TranslationLocale[]
  refreshTask: () => Promise<void>
}

const getLocale = (localeId: string, locales: TranslationLocale[]): TranslationLocale | undefined =>
  locales.find((l) => l.localeId === localeId)

export const TaskView = ({task, locales, refreshTask}: JobProps) => {
  const context = useContext(TranslationContext)
  const toast = useToast()

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [importingLocaleIds, setImportingLocaleIds] = useState<Set<string>>(new Set())

  const importFile = useCallback(
    async (localeId: string) => {
      if (!context) {
        toast.push({
          title:
            'Missing context, unable to import translation. Try refreshing or clicking away from this tab and back.',
          status: 'error',
          closable: true,
        })
        return
      }

      setImportingLocaleIds((prev) => new Set(prev).add(localeId))
      const locale = getLocale(localeId, locales)
      const localeTitle = locale?.description || localeId

      try {
        const translation = await context.adapter.getTranslation(
          task.taskId,
          localeId,
          context.secrets,
        )

        const sanityId = context.localeIdAdapter
          ? await context.localeIdAdapter(localeId)
          : localeId

        if (translation == null) {
          toast.push({
            title: `Error getting ${localeTitle} translation`,
            description: 'No translation returned',
            status: 'error',
            closable: true,
          })
        } else {
          const document =
            typeof translation === 'string' ? translation : JSON.stringify(translation)
          await context.importTranslation(sanityId, document)

          toast.push({
            title: `Imported ${localeTitle} translation`,
            status: 'success',
            closable: true,
          })
        }
      } catch (err) {
        let errorMsg: string | null = null
        if (err instanceof Error) {
          errorMsg = err.message
        } else if (typeof err === 'string') {
          errorMsg = err
        } else if (err != null) {
          errorMsg = JSON.stringify(err)
        }

        toast.push({
          title: `Error getting ${localeTitle} translation`,
          description: errorMsg,
          status: 'error',
          closable: true,
        })
      }

      setImportingLocaleIds((prev) => {
        const next = new Set(prev)
        next.delete(localeId)
        return next
      })
    },
    [locales, context, task.taskId, toast],
  )

  const localesAt100 = task.locales.filter((l) => (l.progress ?? 0) === 100)
  const showImportAll = localesAt100.length >= 2
  const isAnyImportRunning = importingLocaleIds.size > 0
  const concurrency = context?.importAllConcurrency ?? 10

  const runWithConcurrency = useCallback(
    async (localeIds: string[]) => {
      const workerCount = Math.min(concurrency, localeIds.length)
      const workers = Array.from({length: workerCount}, (_, workerIndex) =>
        Promise.all(
          localeIds
            .filter((_, index) => index % workerCount === workerIndex)
            .map((localeId) => importFile(localeId)),
        ),
      )
      await Promise.all(workers)
    },
    [concurrency, importFile],
  )

  const handleImportAllClick = useCallback(() => {
    void runWithConcurrency(localesAt100.map((l) => l.localeId))
  }, [runWithConcurrency, localesAt100])

  const handleRefreshClick = useCallback(async () => {
    setIsRefreshing(true)
    await refreshTask()
    setIsRefreshing(false)
  }, [refreshTask])

  return (
    <Stack gap={4}>
      <Flex align="center" justify="space-between">
        <Text as="h2" weight="semibold" size={2}>
          Current Job Progress
        </Text>

        <Flex gap={3}>
          {task.linkToVendorTask && (
            <Button
              as="a"
              text="View Job"
              iconRight={ArrowTopRightIcon}
              href={task.linkToVendorTask}
              target="_blank"
              rel="noreferrer noopener"
              fontSize={1}
              padding={2}
              mode="bleed"
            />
          )}
          <Button
            fontSize={1}
            padding={2}
            text={isRefreshing ? 'Refreshing' : 'Refresh Status'}
            onClick={handleRefreshClick}
            disabled={isRefreshing}
          />
          {showImportAll && (
            <Button
              fontSize={1}
              padding={2}
              text="Import All"
              onClick={handleImportAllClick}
              disabled={isAnyImportRunning}
              tone="positive"
            />
          )}
        </Flex>
      </Flex>

      <Box>
        {task.locales.map((localeTask) => {
          const reportPercent = localeTask.progress || 0
          const locale = getLocale(localeTask.localeId, locales)
          return (
            <LanguageStatus
              key={[task.taskId, localeTask.localeId].join('.')}
              importFile={async () => {
                await importFile(localeTask.localeId)
              }}
              title={locale?.description || localeTask.localeId}
              progress={reportPercent}
              isImporting={importingLocaleIds.has(localeTask.localeId)}
            />
          )
        })}
      </Box>
    </Stack>
  )
}
