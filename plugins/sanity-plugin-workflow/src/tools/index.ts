import type {Tool} from 'sanity'

import {SplitVerticalIcon} from '@sanity/icons'

import type {WorkflowConfig} from '../types'

import WorkflowTool from '../components/WorkflowTool'

export type WorkflowToolConfig = (options: WorkflowConfig) => Tool

export const workflowTool: WorkflowToolConfig = (options: WorkflowConfig) => ({
  name: 'workflow',
  title: 'Workflow',
  component: WorkflowTool,
  icon: SplitVerticalIcon,
  options,
})
