import {SparklesIcon} from '@sanity/icons/Sparkles'
import {lazy} from 'react'
import {type DocumentInspector} from 'sanity'
import {typed} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'

import {pluginTitle} from '../constants'
import {type AssistInspectorRouteParams, fieldPathParam, instructionParam} from '../types'
import {aiInspectorId} from './constants'

const AssistInspectorWrapper = lazy(() => import('./AssistInspector.lazy'))

export const assistInspector: DocumentInspector = {
  name: aiInspectorId,
  useMenuItem: () => ({
    icon: SparklesIcon,
    title: pluginTitle,
    hidden: true,
    showAsAction: false,
  }),
  component: AssistInspectorWrapper,
  onClose({params}) {
    return {
      params: typed<AssistInspectorRouteParams>({
        ...params,
        [fieldPathParam]: undefined,
        [instructionParam]: undefined,
        // oxlint-disable-next-line no-unsafe-type-assertion
      }) as typeof params,
    }
  },
}
