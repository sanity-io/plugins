import {LaunchIcon} from '@sanity/icons'
import type {Tool} from 'sanity'

import {
  CrossDatasetDuplicatorTool,
  type MultiToolConfig,
} from '../components/CrossDatasetDuplicatorTool'

export const crossDatasetDuplicatorTool = (): Tool<MultiToolConfig> => ({
  title: 'Duplicator',
  name: 'duplicator',
  icon: LaunchIcon,
  component: CrossDatasetDuplicatorTool,
  options: {
    docs: [],
  },
})
