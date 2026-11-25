import {defineLocaleResourceBundle} from 'sanity'

export const languageFilterLocaleNamespace = 'language-filter'

export const languageFilterUsEnglishLocaleBundle = defineLocaleResourceBundle({
  locale: 'en-US',
  namespace: languageFilterLocaleNamespace,
  resources: {
    'hide-all': 'Hide all',
    'show-all': 'Show all',
    'filter-languages': 'Filter languages',
    'showing-all': 'Showing all',
    'showing-count': 'Showing {{selected}} / {{total}}',
  },
})
