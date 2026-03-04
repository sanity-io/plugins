import {outdent} from 'outdent'

import type {InitFlags} from '../actions/init'
import type {InjectTemplate} from '../actions/inject'

export function pkgConfigTemplate(options: {outDir: string; flags: InitFlags}): InjectTemplate {
  const {flags, outDir} = options

  return {
    type: 'template',
    force: flags.force,
    to: flags.typescript ? 'package.config.ts' : 'package.config.js',
    value: outdent`
      import {defineConfig} from '@sanity/pkg-utils'

      export default defineConfig({
        dist: '${outDir}',
        tsconfig: 'tsconfig.${outDir}.json',

        // Remove this block to enable strict export validation
        extract: {
          rules: {
            'ae-incompatible-release-tags': 'off',
            'ae-internal-missing-underscore': 'off',
            'ae-missing-release-tag': 'off',
          },
        },
      })
    `,
  }
}
