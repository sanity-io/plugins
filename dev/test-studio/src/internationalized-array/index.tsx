import {definePlugin} from 'sanity'
import {internationalizedArray} from 'sanity-plugin-internationalized-array'

export const internationalizedArrayExample = definePlugin(() => ({
  plugins: [
    internationalizedArray({
      languages: [
        {id: 'en', title: 'English'},
        {id: 'es', title: 'Spanish'},
        {id: 'fr', title: 'French'},
        {id: 'de', title: 'German'},
      ],
      defaultLanguages: ['en'],
      fieldTypes: ['string', 'text'],
    }),
  ],
}))
