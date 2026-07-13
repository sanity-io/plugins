import type {InitFlags} from '../actions/init'
import type {InjectTemplate} from '../actions/inject'

export function oxlintConfigTemplate(options: {flags: InitFlags}): InjectTemplate {
  const {flags} = options

  const oxlintConfig = {
    $schema: './node_modules/oxlint/configuration_schema.json',
    extends: ['./node_modules/@sanity/plugin-kit/oxlint-config.json'],
  }

  return {
    type: 'template',
    force: flags.force,
    to: '.oxlintrc.json',
    value: JSON.stringify(oxlintConfig, null, 2),
  }
}
