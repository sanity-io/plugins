import {assist} from '@sanity/assist'
import {definePlugin} from 'sanity'

import {issue912Repro} from './issue-912-repro'

export const assistExample = definePlugin(() => ({
  schema: {
    types: [issue912Repro],
  },
  plugins: [
    assist({
      translate: {
        document: {
          languageField: 'language',
          documentTypes: ['lesson'],
        },
        field: {
          documentTypes: ['internationalizedPost', 'issue912Repro'],
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
