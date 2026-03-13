import {definePlugin} from 'sanity'

export function presetsComposer() {
  return definePlugin({
    name: '@sanity/presets',
  })()
}
