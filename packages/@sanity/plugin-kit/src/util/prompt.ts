import path from 'path'
import {URL} from 'url'

import inquirer, {type Question} from 'inquirer'
import validNpmName from 'validate-npm-package-name'

import type {InjectOptions} from '../actions/inject'
import {githubUrlToObject} from './github-url'

interface PromptOptions {
  choices?: any
  type?: string
  default?: any
  filter?: (val: any) => any
  validate?: (val: any) => boolean | string
}

export async function prompt(message: string, options: PromptOptions) {
  const type = options.choices ? 'select' : (options.type ?? 'input')
  const question: Question & Pick<PromptOptions, 'validate'> = {
    ...options,
    type,
    message,
    name: 'single',
  }
  const {filter, validate} = options
  if (validate) {
    // Classic inquirer ran `validate` on the filtered value; the modern rewrite applies
    // `filter` only after the prompt resolves, so restore the original semantics here
    // (all filters used with `prompt` are idempotent)
    question.validate = (value: any) => validate(filter ? filter(value) : value)
  }
  const result = await inquirer.prompt([question])
  return result && result.single
}

prompt.separator = () => new inquirer.Separator()

export function promptForPackageName({basePath}: InjectOptions, defaultVal?: string) {
  return prompt('Plugin name (sanity-plugin-...)', {
    default: defaultVal || path.basename(basePath),
    filter: (name) => {
      const prefixless = name.trim().replace(/^sanity-plugin-/, '')
      return name[0] === '@' ? name : `sanity-plugin-${prefixless}`
    },
    validate: (name) => {
      const valid: {errors?: string[]} = validNpmName(name)
      if (valid.errors) {
        return valid.errors[0]
      }

      if (name[0] !== '@' && name.endsWith('plugin')) {
        return `Name shouldn't include "plugin" multiple times (${name})`
      }

      return true
    },
  })
}

export function promptForRepoOrigin(_options: InjectOptions, defaultVal?: string) {
  return prompt('Git repository URL', {
    default: defaultVal,
    filter: (raw) => {
      const url = (raw || '').trim()
      const gh = githubUrlToObject(url)
      return gh ? `git+ssh://git@github.com/${gh.user}/${gh.repo}.git` : url
    },
    validate: (url) => {
      if (!url) {
        return true
      }

      try {
        const parsed = new URL(url)
        return parsed ? true : 'Invalid URL'
      } catch {
        return 'Invalid URL'
      }
    },
  })
}
