import {styleText} from 'node:util'

import type {TypedFlags} from 'meow'

import sharedFlags from '../../sharedFlags'
import log from '../../util/log'
import {outdent} from '../../util/outdent'

const splitLine = `\n----------------------------------------------------------`

export const verifyPackageConfigDefaults = {
  'packageName': true,
  'esmOnly': true,
  'tsconfig': true,
  'deprecatedDependencies': true,
  'babelConfig': true,
  'scripts': true,
  'pkg-utils': true,
  'nodeEngine': true,
  'srcIndex': true,
  'bannedFiles': true,
  'oxfmt': true,
  'oxlint': true,
} as const

export type VerifyPackageConfig = Partial<Record<keyof typeof verifyPackageConfigDefaults, boolean>>

export const verifyFlags = {
  ...sharedFlags,
  single: {
    default: false,
    type: 'boolean',
  },
} as const

export type VerifyFlags = TypedFlags<typeof verifyFlags>

function disableCheckText(checkKey: string) {
  return styleText(
    'grey',
    outdent`
              To skip this validation add the following to your package.json:
              "sanityPlugin": {
                 "verifyPackage": {
                    "${checkKey}": false
                 }
              }
          `.trimStart(),
  )
}

export function createValidator(
  verifyConfig: VerifyPackageConfig,
  flags: VerifyFlags,
  errors: string[],
) {
  return async function validation(
    checkKey: keyof VerifyPackageConfig,
    task: () => Promise<string[] | undefined>,
  ) {
    if (verifyConfig[checkKey] !== false) {
      const result = await task()
      if (result?.length) {
        result.push(disableCheckText(checkKey))
        const errorMessage = result.join('\n\n')
        errors.push(errorMessage)
        log.error(`\n` + errorMessage + splitLine)
      }
    }

    if (flags.single && errors.length) {
      throw new Error(
        outdent`Detected outstanding package validation issues.

        Fail-fast (--single) mode enabled, stopping validation here.
        `,
      )
    }
  }
}
