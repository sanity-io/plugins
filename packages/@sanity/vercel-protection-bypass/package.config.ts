import { defineConfig } from '@sanity/pkg-utils'

export default defineConfig({
  extract: { enabled: false, },
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
