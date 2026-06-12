import {authenticate, getHeaders, findExistingJob} from './helpers'
import {Adapter, Secrets} from 'sanity-translations-tab'

interface WorkflowProgressItem {
  workflowStepSummaryReportItemList: {
    wordCount: number
  }[]
}

interface SmartlingProgressItem {
  targetLocaleId: string
  progress: {
    percentComplete: number
    totalWordCount: number
  }
  workflowProgressReportList: WorkflowProgressItem[]
}

export const getTranslationTask: Adapter['getTranslationTask'] = async (
  documentId: string,
  secrets: Secrets | null,
) => {
  if (!secrets?.project || !secrets?.secret || !secrets?.proxy) {
    return {
      documentId,
      taskId: documentId,
      locales: [],
    }
  }

  const {project, proxy} = secrets

  const accessToken = await authenticate(secrets)
  const taskId = await findExistingJob(documentId, secrets, accessToken)
  if (!taskId) {
    return {
      documentId,
      taskId: documentId,
      locales: [],
    }
  }

  const progressUrl = `https://api.smartling.com/jobs-api/v3/projects/${project}/jobs/${taskId}/progress`
  const smartlingTask = await fetch(proxy, {
    method: 'GET',
    headers: getHeaders(progressUrl, accessToken),
  })
    .then((res) => res.json())
    .then((res) => res.response.data)

  let locales = []
  if (smartlingTask && smartlingTask.contentProgressReport) {
    locales = smartlingTask.contentProgressReport.map((item: SmartlingProgressItem) => {
      let progress = item.progress ? item.progress.percentComplete : 0
      if (
        item.workflowProgressReportList &&
        item.workflowProgressReportList.length > 0 &&
        item.progress
      ) {
        //default to the first workflow -- it's likely what is being used
        const progressItem = item.workflowProgressReportList[0]
        //this is a list of the various steps in the workflow
        if (
          progressItem.workflowStepSummaryReportItemList &&
          progressItem.workflowStepSummaryReportItemList.length > 1
        ) {
          //get the last step in the workflow -- usually "published"
          const lastStep = progressItem.workflowStepSummaryReportItemList.at(-1)
          //get the percentage of how many words have reached the last step
          if (lastStep && lastStep.wordCount >= 0) {
            progress = Math.floor((lastStep.wordCount / item.progress.totalWordCount) * 100) ?? 0
          }
        }
      }
      return {
        localeId: item.targetLocaleId,
        progress,
      }
    })
  }

  return {
    documentId,
    locales,
    //since our download is tied to document id for smartling, keep track of it as a task
    taskId: documentId,
    linkToVendorTask: `https://dashboard.smartling.com/app/projects/${project}/account-jobs/${project}:${taskId}`,
  }
}
