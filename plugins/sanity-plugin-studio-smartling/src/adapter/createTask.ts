import {authenticate, getHeaders, findExistingJob} from './helpers'
import {Adapter, Secrets, SerializedDocument} from 'sanity-translations-tab'
import {getTranslationTask} from './getTranslationTask'
import {Buffer} from 'buffer'

const createJob = (
  jobName: string,
  secrets: Secrets,
  localeIds: string[],
  accessToken: string,
  documentId: string,
) => {
  const {project, proxy} = secrets
  if (!project || !proxy) {
    throw new Error(
      'The Smartling adapter requires a Smartling project identifier and a proxy URL. Please check your secrets document in this dataset, per the plugin documentation.',
    )
  }

  const url = `https://api.smartling.com/jobs-api/v3/projects/${project}/jobs`
  return fetch(proxy, {
    method: 'POST',
    headers: {
      ...getHeaders(url, accessToken),
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      jobName,
      targetLocaleIds: localeIds,
      referenceNumber: documentId,
    }),
  })
    .then((res) => res.json())
    .then((res) => res.response.data.translationJobUid)
}

/* we're using batches here because it eliminates some
 * new string authorization issues for updating existing jobs,
 * and is able to be used for new bulk
 * job functionality.
 */

const createJobBatch = (
  jobId: string,
  secrets: Secrets,
  documentId: string,
  accessToken: string,
  localeIds: string[],
  workflowUid?: string,
  //eslint-disable-next-line max-params
) => {
  const {project, proxy} = secrets
  if (!project || !proxy) {
    throw new Error(
      'The Smartling adapter requires a Smartling project identifier and a proxy URL. Please check your secrets document in this dataset, per the plugin documentation.',
    )
  }
  const url = `https://api.smartling.com/job-batches-api/v2/projects/${project}/batches`
  const reqBody: {
    authorize: boolean
    translationJobUid: string
    fileUris: string[]
    localeWorkflows?: {targetLocaleId: string; workflowUid: string}[]
  } = {
    authorize: true,
    translationJobUid: jobId,
    fileUris: [documentId],
  }

  if (workflowUid) {
    reqBody.localeWorkflows = localeIds.map((l) => ({
      targetLocaleId: l,
      workflowUid,
    }))
  }

  return fetch(proxy, {
    method: 'POST',
    headers: {
      ...getHeaders(url, accessToken),
      'content-type': 'application/json',
    },
    body: JSON.stringify(reqBody),
  })
    .then((res) => res.json())
    .then((res) => res.response.data.batchUid)
}

const uploadFileToBatch = (
  batchUid: string,
  documentId: string,
  document: SerializedDocument,
  secrets: Secrets,
  localeIds: string[],
  accessToken: string,
  callbackUrl?: string,
  //eslint-disable-next-line max-params
) => {
  const {project, proxy} = secrets
  if (!project || !proxy) {
    throw new Error(
      'The Smartling adapter requires a Smartling project identifier and a proxy URL. Please check your secrets document in this dataset, per the plugin documentation.',
    )
  }
  const url = `https://api.smartling.com/job-batches-api/v2/projects/${project}/batches/${batchUid}/file`
  const formData = new FormData()
  formData.append('fileUri', documentId)
  formData.append('fileType', 'html')
  const htmlBuffer = Buffer.from(document.content, 'utf-8')
  formData.append('file', new Blob([htmlBuffer]), `${document.name}.html`)
  localeIds.forEach((localeId) => formData.append('localeIdsToAuthorize[]', localeId))
  if (callbackUrl) {
    formData.append('callbackUrl', callbackUrl)
  }

  return fetch(proxy, {
    method: 'POST',
    headers: getHeaders(url, accessToken),
    body: formData,
  }).then((res) => res.json())
}

export const createTask: Adapter['createTask'] = async (
  documentId: string,
  document: SerializedDocument,
  localeIds: string[],
  secrets: Secrets | null,
  workflowUid?: string,
  callbackUrl?: string,
  // eslint-disable-next-line max-params
) => {
  if (!secrets?.project || !secrets?.secret || !secrets?.proxy) {
    throw new Error(
      'The Smartling adapter requires a project ID, a secret key, and a proxy URL. Please check your secrets document in this dataset, per the plugin documentation.',
    )
  }

  const accessToken = await authenticate(secrets)

  let taskId = await findExistingJob(document.name, secrets, accessToken)
  if (!taskId) {
    taskId = await createJob(document.name, secrets, localeIds, accessToken, documentId)
  }

  const batchUid = await createJobBatch(
    taskId,
    secrets,
    documentId,
    accessToken,
    localeIds,
    workflowUid,
  )
  const uploadFileRes = await uploadFileToBatch(
    batchUid,
    documentId,
    document,
    secrets,
    localeIds,
    accessToken,
    callbackUrl,
  )
  //eslint-disable-next-line no-console -- for developer debugging
  console.info('Upload status from Smartling: ', uploadFileRes)

  return getTranslationTask(documentId, secrets)
}
