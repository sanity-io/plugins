import {transformSync} from 'oxc-transform-react'
import type {Plugin} from 'vitest/config'

const SCRIPT_FILE_RE = /\.[tj]sx?(?:\?|$)/
const JSX_FILE_RE = /\.[tj]sx(?:\?|$)/
const REACT_IMPORT_RE = /(?:from|import)\s*['"]react(?:['"]|\/)/

/**
 * Runs the oxc React Compiler over plugin sources in Vitest, mirroring
 * `reactCompiler: {transform: 'oxc'}` in `tsdown.config.ts` so tests exercise
 * the same compiled output that ships to npm.
 *
 * The compiler should always run for plugin code, but `@vitejs/plugin-react`'s
 * `compiler: true` option never applies in Vitest (Vitest transforms modules
 * through Vite's server pipeline, which that integration does not compile), so
 * this plugin calls `oxc-transform-react` directly.
 */
export function reactCompilerPluginForVitest(): Plugin {
  return {
    name: 'vitest-react-compiler',
    enforce: 'pre',
    transform: {
      filter: {id: {include: SCRIPT_FILE_RE, exclude: /\/node_modules\//}},
      handler(code, id) {
        const filename = id.includes('?') ? id.slice(0, id.indexOf('?')) : id
        // Skip non-JSX modules that do not import React. oxc DCE would otherwise
        // drop unused side-effect imports (e.g. `@testing-library/jest-dom/vitest`
        // in a Vitest setup file). `.tsx`/`.jsx` always compile — automatic-runtime
        // JSX needs no explicit `react` import.
        if (!JSX_FILE_RE.test(filename) && !REACT_IMPORT_RE.test(code)) {
          return null
        }
        const result = transformSync(filename, code, {
          jsx: {runtime: 'automatic'},
          reactCompiler: true,
          sourcemap: true,
        })
        if (result.fatal) {
          throw new Error(
            result.errors.map((error) => error.message).join('\n') ||
              'React Compiler transform failed.',
          )
        }
        return {code: result.code, map: result.map}
      },
    },
  }
}
