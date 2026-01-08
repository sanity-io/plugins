import {defineCliConfig} from 'sanity/cli'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'ppsg7ml5'
const dataset = process.env.SANITY_STUDIO_DATASET || 'plugins'
const appId = process.env.SANITY_STUDIO_APP_ID || 'bi1ktslqwmu1cawds5ce3jn6'
const tsRE = /\.tsx?$/

export default defineCliConfig({
  api: {projectId, dataset},
  deployment: {appId, autoUpdates: false},
  reactStrictMode: true,
  reactCompiler: {
    target: '19',
    sources: (filename) => {
      // The default behavior is to always skip node_modules: https://github.com/facebook/react/blob/d6cae440e34c6250928e18bed4a16480f83ae18a/compiler/packages/babel-plugin-react-compiler/src/Entrypoint/Options.ts#L326
      if (filename.indexOf('node_modules') !== -1) {
        return false
      }
      // If the file is `.ts` or `.tsx` then we should run the compiler (it's resolved with the `development` condition during `sanity dev`)
      // otherwise it's likely resolving a built file that had react compiler already applied during its build process
      return tsRE.test(filename)
    },
  },
  studioHost: 'plugins',
  typegen: {formatGeneratedCode: false},
  // vite: {
  //   resolve: {dedupe: ['react', 'react-dom', 'sanity', 'styled-components']},
  //   // optimizeDeps: {
  //   // exclude: ['sanity'],
  //   // include: ['sanity > react-is'],
  //   // },
  // },
})
