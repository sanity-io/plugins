import {definePlugin, isObjectInputProps, type Plugin} from 'sanity'

import type {WorkflowConfig} from './types'

import {useCompleteWorkflow} from './actions/useCompleteWorkflow'
import {defineUpdateWorkflow} from './actions/defineUpdateWorkflow'
import {useAssignWorkflow} from './actions/useAssignWorkflow'
import {useBeginWorkflow} from './actions/useBeginWorkflow'
import {useAssigneesBadge} from './badges/useAssigneesBadge'
import {useStateBadge} from './badges/useStateBadge'
import {WorkflowProvider} from './components/WorkflowContext'
import WorkflowSignal from './components/WorkflowSignal'
import {DEFAULT_CONFIG} from './constants'
import metadata from './schema/workflow/workflow.metadata'
import {workflowTool} from './tools'

export const workflow: Plugin<WorkflowConfig> = definePlugin<WorkflowConfig>(
  (config = DEFAULT_CONFIG) => {
    const {schemaTypes, states} = {...DEFAULT_CONFIG, ...config}

    if (!states?.length) {
      throw new Error(`Workflow plugin: Missing "states" in config`)
    }

    if (!schemaTypes?.length) {
      throw new Error(`Workflow plugin: Missing "schemaTypes" in config`)
    }

    const useUpdateActions = states.map((state) => defineUpdateWorkflow(state))

    return {
      name: 'sanity-plugin-workflow',
      schema: {
        types: [metadata(states)],
      },
      // TODO: Remove 'workflow.metadata' from list of new document types
      // ...
      studio: {
        components: {
          layout: (props) => (
            <WorkflowProvider {...props} schemaTypes={schemaTypes} states={states} />
          ),
        },
      },
      form: {
        components: {
          input: (props) => {
            if (
              props.id === `root` &&
              isObjectInputProps(props) &&
              schemaTypes.includes(props.schemaType.name)
            ) {
              return <WorkflowSignal {...props} />
            }

            return props.renderDefault(props)
          },
        },
      },
      document: {
        actions: (prev, context) => {
          if (!schemaTypes.includes(context.schemaType)) {
            return prev
          }

          return [
            useBeginWorkflow,
            useAssignWorkflow,
            ...useUpdateActions,
            useCompleteWorkflow,
            ...prev,
          ]
        },
        badges: (prev, context) => {
          if (!schemaTypes.includes(context.schemaType)) {
            return prev
          }

          if (!context.documentId) {
            return prev
          }

          return [useStateBadge, useAssigneesBadge, ...prev]
        },
      },
      tools: [
        // TODO: These configs could be read from Context
        workflowTool({schemaTypes, states}),
      ],
    }
  },
)
