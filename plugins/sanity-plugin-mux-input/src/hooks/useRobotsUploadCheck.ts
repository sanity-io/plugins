import {useToast} from '@sanity/ui/toast'
import {useEffect, useRef, useState} from 'react'

import {listRobotsDirectiveRuns, listRobotsJobs} from '../actions/robots'
import {capabilityFromError} from '../robots/capability'
import {getRobotsSyncStore} from '../robots/sync'
import type {VideoAssetDocument} from '../util/types'
import {useClient} from './useClient'

/** A minute: Mux can take a while to list the run once the asset is ready. */
const ATTEMPTS = 12
const INTERVAL_MS = 5000

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

interface UploadWithDirectives {
  documentId: string
  directiveIds: string[]
}

/**
 * After an upload that attached directives, looks for their work once the asset is ready, and
 * says so: Mux dispatches the run server-side, with nothing else to observe it. Once per upload.
 */
export function useRobotsUploadCheck(asset: VideoAssetDocument | null | undefined) {
  const client = useClient()
  const toast = useToast()
  const [upload, setUpload] = useState<UploadWithDirectives>()
  const checkedDocumentId = useRef<string>(undefined)
  const readyAssetId =
    upload && asset?._id === upload.documentId && asset.status === 'ready'
      ? asset.assetId
      : undefined

  useEffect(() => {
    if (!upload || !readyAssetId || checkedDocumentId.current === upload.documentId) {
      return undefined
    }
    let cancelled = false

    const check = async () => {
      let hasFound = false
      for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
        if (attempt > 0) await wait(INTERVAL_MS)
        if (cancelled) return
        try {
          // A run exists before its first job does, so either one answers.
          const [jobs, ...runLists] = await Promise.all([
            listRobotsJobs(client, {assetId: readyAssetId, limit: 1}),
            ...upload.directiveIds.map((id) => listRobotsDirectiveRuns(client, id, {limit: 25})),
          ])
          const hasRun = runLists.some((runs) =>
            (runs.data ?? []).some((run) => run.subject_id === readyAssetId),
          )
          if (cancelled) return
          const hasJob = (jobs.data ?? []).length > 0
          if ((hasJob || hasRun) && !hasFound) {
            hasFound = true
            toast.push({
              status: 'success',
              title: 'Robots is working on this video',
              description: 'Open Robots from the video’s menu to follow along.',
            })
          }
          if (hasJob) break
        } catch (error) {
          const unavailable = capabilityFromError(error)
          if (unavailable) {
            if (!cancelled && unavailable.state !== 'unavailable') {
              toast.push({
                status: 'warning',
                title: 'The video uploaded, but Robots couldn’t run its directives',
                description:
                  unavailable.state === 'scope-missing'
                    ? 'This Mux token can’t use Robots.'
                    : 'Robots isn’t enabled for this Mux account.',
              })
            }
            return
          }
          // Nobody asked for this check, so a passing failure stays quiet and the next try runs.
          console.error('[sanity-plugin-mux-input] Could not check Robots on the new video', error)
        }
      }
      // Recording the jobs turns on the background sync, so their outputs and new tracks reach
      // the document even if Robots is never opened. Also when time ran out on a run alone.
      if (hasFound && !cancelled) {
        getRobotsSyncStore(client, upload.documentId, readyAssetId).refreshNow()
      }
    }

    // Marked once it ends, so a check a re-run cut short starts over.
    void check().then(() => {
      if (!cancelled) checkedDocumentId.current = upload.documentId
    })
    return () => {
      cancelled = true
    }
  }, [client, toast, upload, readyAssetId])

  /** Call when an upload finishes, with the directives it attached. */
  return (documentId: string, directiveIds: string[]) => {
    if (directiveIds.length > 0) setUpload({documentId, directiveIds})
  }
}
