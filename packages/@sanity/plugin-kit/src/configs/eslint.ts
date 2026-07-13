import type {InitFlags} from '../actions/init'
import type {InjectTemplate} from '../actions/inject'

export function eslintrcTemplate(options: {flags: InitFlags}): InjectTemplate {
  const {flags} = options

  const eslintConfig = {
    root: true,
    env: {
      node: true,
      browser: true,
    },
    extends: [
      'sanity',
      flags.typescript && 'sanity/typescript',
      'sanity/react',
      'plugin:react-hooks/recommended',
      // eslint-config-prettier: disables stylistic rules that conflict with oxfmt's
      // (prettier-compatible) formatting; it does not run prettier
      flags.oxfmt && 'prettier',
      'plugin:react/jsx-runtime',
    ].filter(Boolean),
  }

  return {
    type: 'template',
    force: flags.force,
    to: '.eslintrc',
    value: JSON.stringify(eslintConfig, null, 2),
  }
}

export function eslintignoreTemplate(options: {flags: InitFlags; outDir: string}): InjectTemplate {
  const {flags, outDir} = options

  const patterns = [
    '.eslintrc.js',
    'commitlint.config.js',
    outDir,
    'lint-staged.config.js',
    'package.config.ts',
    flags.typescript ? '*.js' : '',
  ].filter(Boolean)

  patterns.sort()

  return {
    type: 'template',
    force: flags.force,
    to: '.eslintignore',
    value: patterns.join('\n'),
  }
}
