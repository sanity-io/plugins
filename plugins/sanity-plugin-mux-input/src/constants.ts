declare global {
  var __PKG_VERSION__: string | undefined
}
export const PLUGIN_VERSION = typeof __PKG_VERSION__ === 'string' ? __PKG_VERSION__ : '0.0.0-dev'
