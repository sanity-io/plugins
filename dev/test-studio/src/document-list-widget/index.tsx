import {definePlugin} from 'sanity'
import {documentListWidget} from 'sanity-plugin-dashboard-widget-document-list'

export const documentListWidgetExample = definePlugin(() => ({
  plugins: [documentListWidget()],
}))
