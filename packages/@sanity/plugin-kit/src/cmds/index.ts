export default {
  'init': async (options: {argv: string[]}) => {
    await (await import('./init')).default(options)
  },
  'inject': async (options: {argv: string[]}) => {
    await (await import('./inject')).default(options)
  },
  'link-watch': async (options: {argv: string[]}) => {
    await (await import('./link-watch')).default(options)
  },
  'verify-package': async (options: {argv: string[]}) => {
    await (await import('./verify-package')).default(options)
  },
  'version': async (options: {argv: string[]}) => {
    ;(await import('./version')).default(options)
  },
}
