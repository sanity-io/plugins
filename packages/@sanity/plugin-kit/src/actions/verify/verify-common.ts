import chalk from 'chalk'
import type {TypedFlags} from 'meow'
import outdent from 'outdent'

import sharedFlags from '../../sharedFlags'
import log from '../../util/log'

const splitLine = `\n----------------------------------------------------------`

export const verifyPackageConfigDefaults = {
  'packageName': true,
  'esmOnly': true,
  'tsconfig': true,
  'dependencies': true,
  'deprecatedDependencies': true,
  'babelConfig': true,
  'incompatiblePlugin': true,
  'imports': true,
  'scripts': true,
  'pkg-utils': true,
  'nodeEngine': true,
  'studioConfig': true,
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
  return chalk.grey(
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
        outdent`Detected outstanding upgrade issues.

        Fail-fast (--single) mode enabled, stopping validation here.
        `,
      )
    }
  }
}
