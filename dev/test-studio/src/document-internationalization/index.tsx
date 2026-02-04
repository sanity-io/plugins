import {documentInternationalization} from '@sanity/document-internationalization'
import {definePlugin} from 'sanity'

export const documentInternationalizationExample = definePlugin(() => ({
  plugins: [documentInternationalization()],
}))
