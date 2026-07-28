import type {InitFlags} from '../actions/init'
import type {InjectTemplate} from '../actions/inject'

export function oxfmtConfigTemplate(options: {flags: InitFlags}): InjectTemplate {
  const {flags} = options

  return {
    type: 'template',
    force: flags.force,
    to: 'oxfmt.config.ts',
    value: `export {default} from '@sanity/plugin-kit/oxfmt'`,
  }
}
