import {defineRepoConfig} from '@sanity/ailf'

export default defineRepoConfig({
  source: 'production',
  owner: {
    team: 'studio',
  },
  taskSource: {
    type: 'repo',
  },
  triggers: {
    'pr': {
      mode: 'validate-only',
    },
    'pr-task-change': {
      mode: 'eval',
      paths: ['plugins/@sanity/presets/**'],
    },
    'main': {
      mode: 'eval',
      blocking: false,
      notify: true,
    },
  },
})
