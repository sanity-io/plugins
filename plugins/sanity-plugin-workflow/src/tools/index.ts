import {SplitVerticalIcon} from '@sanity/icons/SplitVertical'
import type {Tool} from 'sanity'

import WorkflowTool from '../components/WorkflowTool'
import type {WorkflowConfig} from '../types'

export type WorkflowToolConfig = (options: WorkflowConfig) => Tool

export const workflowTool: WorkflowToolConfig = (options: WorkflowConfig) => ({
  name: 'workflow',
  title: 'Workflow',
  component: WorkflowTool,
  icon: SplitVerticalIcon,
  options,
})
