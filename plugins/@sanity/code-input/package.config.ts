import config from '@repo/package.config'
import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  ...config,
  babel: {reactCompiler: true, styledComponents: true},
  reactCompilerOptions: {target: '19'},
})
