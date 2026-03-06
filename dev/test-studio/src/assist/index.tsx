import {assist} from '@sanity/assist'
import {definePlugin} from 'sanity'

export const assistExample = definePlugin(() => ({
  plugins: [
    assist({
      translate: {
        document: {
          languageField: 'language',
          documentTypes: ['lesson'],
        },
        field: {
          documentTypes: ['internationalizedPost'],
          languages: [
            {id: 'en', title: 'English'},
            {id: 'es', title: 'Spanish'},
            {id: 'fr', title: 'French'},
            {id: 'de', title: 'German'},
            {id: 'pt', title: 'Portuguese'},
            {id: 'it', title: 'Italian'},
          ],
        },
      },
    }),
  ],
}))
