import browserslistConfig from '@sanity/browserslist-config'
import {defineConfig} from '@sanity/tsdown-config'
import {vanillaExtractPlugin} from '@sanity/vanilla-extract-tsdown-plugin'
import browserslist from 'browserslist'
import {browserslistToTargets} from 'lightningcss'
import type {UserConfig} from 'tsdown'

const config = await defineConfig({
  reactCompiler: {transform: 'oxc'},
  // 0.33 writes `package.json#sideEffects` from the output. A side-effect-only
  // `.css.ts` import is then dropped on the next build, so leave the field alone.
  sideEffects: false,
})

const withVanillaExtract: UserConfig = {
  ...config,
  plugins: [
    config.plugins,
    vanillaExtractPlugin({
      identifiers: 'safe',
      inject: true,
      exports: {nodeCompat: true},
      // `@sanity/tsdown-config` used to apply this browserslist fallback itself.
      // These packages target Node, which names no browsers, so without it the
      // extracted CSS is not lowered.
      lightningcss: {targets: browserslistToTargets(browserslist(browserslistConfig))},
    }),
  ],
}

export default withVanillaExtract
