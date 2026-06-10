import type {Adapter, SerializedDocument} from 'sanity-translations-tab'

/*
 * A self-contained translation vendor stub for the demo. Instead of calling a real
 * API, it stores the serialized document in localStorage and "translates" it by
 * prefixing every string with the locale id. This makes the full round trip work
 * offline: importing a locale patches a new value into each internationalized array,
 * written in the new `language` field format.
 *
 * A real integration would use the TransifexAdapter (or another vendor adapter).
 */

const STORAGE_KEY = 'i18nArrayTranslationDemoTasks'

type StoredTask = {
  taskId: string
  documentId: string
  localeIds: string[]
  content: string
}

const readTasks = (): StoredTask[] => {
  try {
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- demo localStorage payload
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]') as StoredTask[]
  } catch {
    return []
  }
}

const writeTasks = (tasks: StoredTask[]) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  } catch {
    // ignore quota/availability errors in the demo
  }
}

const toTask = (taskId: string, documentId: string, localeIds: string[]) => ({
  taskId,
  documentId,
  locales: localeIds.map((localeId) => ({localeId, progress: 100})),
})

export const demoAdapter: Adapter = {
  getLocales: async () => [
    {localeId: 'de', description: 'German', enabled: true},
    {localeId: 'no_nb', description: 'Norwegian (Bokmål)', enabled: true},
    {localeId: 'is', description: 'Icelandic', enabled: true},
  ],
  getTranslationTask: async (documentId) => {
    const tasks = readTasks()
    // Find the most recent task for this document (scan from the end).
    let task: StoredTask | undefined
    for (let i = tasks.length - 1; i >= 0; i--) {
      if (tasks[i].documentId === documentId) {
        task = tasks[i]
        break
      }
    }
    if (!task) {
      return {taskId: documentId, documentId, locales: []}
    }
    return toTask(task.taskId, documentId, task.localeIds)
  },
  createTask: async (documentId: string, serialized: SerializedDocument, localeIds: string[]) => {
    const taskId = Date.now().toString()
    writeTasks([...readTasks(), {taskId, documentId, localeIds, content: serialized.content}])
    return toTask(taskId, documentId, localeIds)
  },
  getTranslation: async (taskId: string, localeId: string) => {
    const task = readTasks().find((t) => t.taskId === taskId)
    if (!task) return null
    // Simulate a translation by prefixing each serialized string with the locale.
    return task.content.replace(/(<span\b[^>]*>)/g, `$1[${localeId}] `)
  },
}
