import {transformSync} from 'oxc-transform-react'
import {defineConfig} from 'vitest/config'

/** Apply oxc React Compiler in Vitest SSR (`consumer: 'server'`). `react({compiler: true})` skips server. */
function reactCompilerPluginForVitest() {
  return {
    name: 'vitest-react-compiler',
    enforce: 'pre',
    transform: {
      filter: {id: {include: /\.[tj]sx?(?:\?|$)/, exclude: /\/node_modules\//}},
      handler(code: string, id: string) {
        const filename = id.includes('?') ? id.slice(0, id.indexOf('?')) : id
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

export default defineConfig({
  // Match `reactCompiler: {transform: 'oxc'}` in tsdown.config.ts so tests exercise compiled output.
  plugins: [reactCompilerPluginForVitest()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/global.setup.ts'],
    server: {
      deps: {
        inline: ['vitest-package-exports'],
      },
    },
  },
})
