import {Adapter} from 'sanity-translations-tab'
import {getLocales} from './getLocales'
import {getTranslationTask} from './getTranslationTask'
import {createTask} from './createTask'
import {getTranslation} from './getTranslation'

export const SmartlingAdapter: Adapter = {
  getLocales,
  getTranslationTask,
  createTask,
  getTranslation,
}
