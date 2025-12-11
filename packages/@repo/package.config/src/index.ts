import {type PkgConfigOptions} from '@sanity/pkg-utils'

const config = {
  extract: {enabled: false},
  strictOptions: {
    noImplicitBrowsersList: 'off',
    noImplicitSideEffects: 'off',
    noCheckTypes: 'error',
    noPackageJsonBrowser: 'error',
    noPackageJsonTypesVersions: 'error',
    preferModuleType: 'error',
  } satisfies NonNullable<PkgConfigOptions['strictOptions']>,
  dts: 'rolldown',
  tsgo: false, // oxc rust is faster at dts gen than tsgo
  tsconfig: 'tsconfig.build.json',
} as const satisfies PkgConfigOptions

export default config
