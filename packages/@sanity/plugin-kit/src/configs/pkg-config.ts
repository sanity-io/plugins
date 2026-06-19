import {outdent} from 'outdent'

import type {InitFlags} from '../actions/init'
import type {InjectTemplate} from '../actions/inject'

export function pkgConfigTemplate(options: {outDir: string; flags: InitFlags}): InjectTemplate {
  const {flags, outDir} = options

  return {
    type: 'template',
    force: flags.force,
    // Always a `.ts` config: plugins are ESM (`"type": "module"`), so `@sanity/pkg-utils`
    // loads it without needing a `.mts`/`.mjs` extension to force ESM interpretation.
    to: 'package.config.ts',
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
