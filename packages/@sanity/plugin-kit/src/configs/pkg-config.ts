import {outdent} from 'outdent'

import {InitFlags} from '../actions/init'
import {InjectTemplate} from '../actions/inject'

export function pkgConfigTemplate(options: {outDir: string; flags: InitFlags}): InjectTemplate {
  const {flags, outDir} = options

  return {
    type: 'template',
    force: flags.force,
    // .mts/.mjs so the config is always interpreted as ESM, even in CommonJS plugins —
    // the tsx-based config loader in @sanity/pkg-utils v10 cannot load CommonJS-interpreted
    // config files on Node 24
    to: flags.typescript ? 'package.config.mts' : 'package.config.mjs',
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
