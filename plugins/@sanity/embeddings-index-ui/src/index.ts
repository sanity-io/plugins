import '@sanity/ui/styles.css'
// oxlint-disable-next-line import/no-unassigned-import
import './schemas/typeDefExtensions'
import {embeddingsIndexDashboard} from './embeddingsIndexDashboard/dashboardPlugin'
import {embeddingsIndexReferenceInput} from './referenceInput/referencePlugin'

export {embeddingsIndexReferenceInput}

export {embeddingsIndexDashboard}

// oxlint-disable-next-line oxc/no-barrel-file
export * from './api/embeddingsApi'
