import type {Adapter} from 'sanity-translations-tab'

import {createTask} from './createTask'
import {getLocales} from './getLocales'
import {getTranslation} from './getTranslation'
import {getTranslationTask} from './getTranslationTask'

export const TransifexAdapter: Adapter = {
  getLocales,
  getTranslationTask,
  createTask,
  getTranslation,
}
