import type {InitFlags} from '../actions/init'
import type {InjectTemplate} from '../actions/inject'

export function oxlintConfigTemplate(options: {flags: InitFlags}): InjectTemplate {
  const {flags} = options

  return {
    type: 'template',
    force: flags.force,
    to: 'oxlint.config.ts',
    value: `export {default} from '@sanity/plugin-kit/oxlint'`,
  }
}
