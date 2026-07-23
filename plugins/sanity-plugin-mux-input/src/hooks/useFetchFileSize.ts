import {useEffect, useState} from 'react'

import {type StagedUpload} from '../components/Uploader'

type UrlFileSizeState = {
  url: string | null
  fileSize: number | null
  isLoadingFileSize: boolean
  canSkipFileSizeValidation: boolean
}

export function useFetchFileSize(stagedUpload: StagedUpload, maxFileSize?: number) {
  const url = stagedUpload.type === 'url' ? stagedUpload.url : null
  const [urlState, setUrlState] = useState<UrlFileSizeState>(() => ({
    url,
    fileSize: null,
    isLoadingFileSize: Boolean(url),
    canSkipFileSizeValidation: false,
  }))

  if (urlState.url !== url) {
    setUrlState({
      url,
      fileSize: null,
      isLoadingFileSize: Boolean(url),
      canSkipFileSizeValidation: false,
    })
  }

  useEffect(() => {
    if (!url) return undefined

    let cancelled = false

    // Get file size from URL
    const fetchFileSize = async () => {
      setUrlState((prev) =>
        prev.url === url
          ? {
              url,
              fileSize: null,
              isLoadingFileSize: true,
              canSkipFileSizeValidation: false,
            }
          : prev,
      )
      try {
        const response = await fetch(url, {method: 'HEAD'})
        const contentLength = response.headers.get('content-length')
        const newFileSize = contentLength ? parseInt(contentLength, 10) : null

        if (cancelled) return

        setUrlState((prev) =>
          prev.url === url
            ? {
                url,
                fileSize: newFileSize,
                isLoadingFileSize: false,
                canSkipFileSizeValidation: newFileSize === null && maxFileSize !== undefined,
              }
            : prev,
        )
      } catch {
        if (cancelled) return

        console.warn('Could not validate file size from URL')
        setUrlState((prev) =>
          prev.url === url
            ? {
                url,
                fileSize: null,
                isLoadingFileSize: false,
                // Skip validation of file size, but still validate duration
                canSkipFileSizeValidation: true,
              }
            : prev,
        )
      }
    }

    void Promise.resolve().then(fetchFileSize)

    return () => {
      cancelled = true
    }
  }, [maxFileSize, url])

  const fileSize = stagedUpload.type === 'file' ? stagedUpload.files[0]!.size : urlState.fileSize

  return {
    fileSize,
    isLoadingFileSize: stagedUpload.type === 'url' ? urlState.isLoadingFileSize : false,
    canSkipFileSizeValidation:
      stagedUpload.type === 'url' ? urlState.canSkipFileSizeValidation : false,
  }
}
