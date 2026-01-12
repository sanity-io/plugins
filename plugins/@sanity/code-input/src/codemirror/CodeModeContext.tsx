import type {Extension} from '@codemirror/state'

import {memoize} from 'lodash-es'
import {createContext} from 'react'

import type {CodeInputConfig} from '../plugin'
import type {CodeMode} from './defaultCodeModes'

export const CodeInputConfigContext = createContext<CodeInputConfig | undefined>(undefined)

const defaultLanguageModeLoader = memoize(async (mode: string, modes: CodeMode[]) => {
  const codeMode = modes.find((m) => m.name === mode)
  if (!codeMode?.loader) {
    console.warn(
      `Found no codeMode for language mode ${mode}, syntax highlighting will be disabled.`,
    )
    return undefined
  }
  return codeMode.loader()
})
export const CodeInputLanguageModeLoaderContext =
  createContext<(mode: string, defaultCodeModes: CodeMode[]) => Promise<Extension | undefined>>(
    defaultLanguageModeLoader,
  )
