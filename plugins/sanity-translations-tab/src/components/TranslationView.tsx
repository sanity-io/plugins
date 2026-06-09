import {Stack, useToast} from '@sanity/ui'
import {useCallback, useContext, useEffect, useState} from 'react'

import type {TranslationTask, TranslationLocale} from '../types'
import {NewTask} from './NewTask'
import {TaskView} from './TaskView'
import {TranslationContext} from './TranslationContext'

export const TranslationView = () => {
  const [locales, setLocales] = useState<TranslationLocale[]>([])
  const [task, setTask] = useState<TranslationTask | null>(null)

  const context = useContext(TranslationContext)
  const toast = useToast()

  useEffect(() => {
    let isMounted = true

    async function fetchData() {
      if (!context) {
        toast.push({
          title: 'Unable to load translation data: missing context',
          status: 'error',
          closable: true,
        })
        return
      }

      try {
        const fetchedLocales = await context.adapter.getLocales(context.secrets)
        if (!isMounted) {
          return
        }
        setLocales(fetchedLocales)

        const fetchedTask = await context.adapter.getTranslationTask(
          context.documentId,
          context.secrets,
        )
        if (!isMounted) {
          return
        }
        setTask(fetchedTask)
      } catch (err) {
        if (!isMounted) {
          return
        }
        let errorMsg
        if (err instanceof Error) {
          errorMsg = err.message
        } else if (typeof err === 'string') {
          errorMsg = err
        } else {
          errorMsg = null
        }

        toast.push({
          title: `Error loading translation data`,
          description: errorMsg,
          status: 'error',
          closable: true,
        })
      }
    }

    void fetchData()

    return () => {
      isMounted = false
    }
  }, [context, toast])

  const refreshTask = useCallback(async () => {
    await context?.adapter.getTranslationTask(context.documentId, context.secrets).then(setTask)
  }, [context, setTask])

  return (
    <Stack gap={6}>
      <NewTask locales={locales} refreshTask={refreshTask} />
      {task && <TaskView task={task} locales={locales} refreshTask={refreshTask} />}
    </Stack>
  )
}
