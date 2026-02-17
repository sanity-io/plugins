import {defineMigration, del} from 'sanity/migrate'

export default defineMigration({
  title: 'Delete internationalized posts',
  documentTypes: ['internationalizedPost'],
  migrate: {
    document(doc) {
      return del(doc._id)
    },
  },
})
