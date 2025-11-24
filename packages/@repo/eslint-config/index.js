import oxlint from 'eslint-plugin-oxlint'
import reactHooks from 'eslint-plugin-react-hooks'
import {defineConfig, globalIgnores} from 'eslint/config'
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import tseslint from 'typescript-eslint'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootOxlintrc = resolve(__dirname, '../../../.oxlintrc.jsonc')

export default [
  globalIgnores(['**/.sanity/*', '**/dist/*']),
  defineConfig({
    files: ['src/**/*.{cjs,mjs,js,jsx,ts,tsx}'],
    languageOptions: {parser: tseslint.parser},
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
      reportUnusedInlineConfigs: 'error',
    },
  }),
  reactHooks.configs.flat['recommended-latest'],
  {
    // While the recommended-latest react-hooks config enables most react compiler rules, it doesn't enable all of them yet, so we do that here
    name: 'react-hooks/react-compiler',
    rules: {
      // Enabled by default, but are `warn` while we want them to be `error`
      'react-hooks/unsupported-syntax': 'error',
      // Temporarily disabled due to false negatives
      'react-hooks/set-state-in-effect': 'off',
      // Disabled by default, enabled here (https://github.com/facebook/react/blob/5f2b571878ec3b5884f5739915a974b98d7384d5/compiler/packages/babel-plugin-react-compiler/src/CompilerError.ts#L734-L1004)
      'react-hooks/capitalized-calls': 'error',
      'react-hooks/memoized-effect-dependencies': 'error',
      'react-hooks/no-deriving-state-in-effects': 'error',
      'react-hooks/hooks': 'error',
      'react-hooks/invariant': 'error',
      'react-hooks/rule-suppression': 'error',
      'react-hooks/syntax': 'error',
      'react-hooks/todo': 'error',
    },
  },
  // oxlint should be the last one so it is able to turn off rules that it's handling
  ...oxlint.buildFromOxlintConfigFile(rootOxlintrc),
]
