// oxlint-disable import/no-unassigned-import - legacy code will be lint-cleaned in a follow-up PR
import './schemas/typeDefExtensions'
import {embeddingsIndexDashboard} from './embeddingsIndexDashboard/dashboardPlugin'
import {embeddingsIndexReferenceInput} from './referenceInput/referencePlugin'

export {embeddingsIndexReferenceInput}

export {embeddingsIndexDashboard}

export * from './api/embeddingsApi'
