import {definePlugin} from 'sanity'
import {iframePane} from 'sanity-plugin-iframe-pane'

export const iframePaneExample = definePlugin(() => ({
  plugins: [iframePane()],
}))
