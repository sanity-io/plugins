import {type PkgConfigOptions} from '@sanity/pkg-utils'

const config = {
  extract: {enabled: false},
  strictOptions: {
    noImplicitBrowsersList: 'off',
    noImplicitSideEffects: 'off',
    noCheckTypes: 'error',
    noPackageJsonMain: 'error',
    noPackageJsonModule: 'error',
    noPackageJsonBrowser: 'error',
    noPackageJsonTypesVersions: 'error',
    preferModuleType: 'error',
  } satisfies NonNullable<PkgConfigOptions['strictOptions']>,
  dts: 'rolldown',
  // dts gen is much faster using oxc/rust with isolatedDeclarations: true, than it is with tsgo
  tsgo: false,
  tsconfig: 'tsconfig.build.json',
} as const satisfies PkgConfigOptions

export default config
