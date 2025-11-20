import { defineConfig } from '@sanity/pkg-utils'

export default defineConfig({
  extract: {
    rules: {
      'ae-incompatible-release-tags': 'warn',
      'ae-internal-missing-underscore': 'off',
      'ae-missing-release-tag': 'off',
    },
  },
  strictOptions: {
    noImplicitBrowsersList: 'off',
    noImplicitSideEffects: 'off',
    noCheckTypes: 'error',
    noPackageJsonMain: 'error',
    noPackageJsonModule: 'error',
    noPackageJsonBrowser: 'error',
    noPackageJsonTypesVersions: 'error',
    preferModuleType: 'error',
  },
  tsconfig: 'tsconfig.build.json',
  babel: { reactCompiler: true },
  reactCompilerOptions: { target: '18' },
  dts: 'rolldown'
})
