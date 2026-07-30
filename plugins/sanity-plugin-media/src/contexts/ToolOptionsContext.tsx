// oxlint-disable react/react-compiler - legacy code will be lint-cleaned in a follow-up PR
import {type PropsWithChildren, createContext, useContext, useMemo} from 'react'
import type {DropzoneOptions} from 'react-dropzone'

import type {MediaToolOptions, Locale} from '../types'

type ContextProps = {
  dropzone: Pick<DropzoneOptions, 'maxSize'>
  components: MediaToolOptions['components']
  createTagsOnUpload: boolean
  creditLine: MediaToolOptions['creditLine']
  directUploads: MediaToolOptions['directUploads']
  locales?: Locale[]
}

const ToolOptionsContext = createContext<ContextProps | null>(null)

type Props = {
  options?: MediaToolOptions | void
}

export const ToolOptionsProvider = ({options, children}: PropsWithChildren<Props>) => {
  // oxlint-disable-next-line react-compiler
  const value = useMemo<ContextProps>(() => {
    let creditLineExcludeSources

    if (options?.creditLine?.excludeSources) {
      creditLineExcludeSources = Array.isArray(options?.creditLine?.excludeSources)
        ? options.creditLine.excludeSources
        : [options?.creditLine?.excludeSources]
    }

    return {
      dropzone: {maxSize: options?.maximumUploadSize},
      components: {
        details: options?.components?.details,
      },
      createTagsOnUpload: options?.createTagsOnUpload ?? true,
      creditLine: {
        enabled: options?.creditLine?.enabled || false,
        excludeSources: creditLineExcludeSources,
      },
      directUploads: options?.directUploads ?? true,
      locales: options?.locales,
    }
  }, [
    options?.creditLine?.enabled,
    options?.components,
    options?.createTagsOnUpload,
    options?.creditLine?.excludeSources,
    options?.maximumUploadSize,
    options?.directUploads,
    options?.locales,
  ])

  return <ToolOptionsContext.Provider value={value}>{children}</ToolOptionsContext.Provider>
}

export const useToolOptions = () => {
  const context = useContext(ToolOptionsContext)

  if (!context) {
    throw new Error('useToolOptions must be used within an ToolOptionsProvider')
  }

  return context
}
