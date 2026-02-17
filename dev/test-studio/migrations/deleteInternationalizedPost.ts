import {defineMigration, del} from 'sanity/migrate'

export default defineMigration({
  title: 'Delete internationalized posts',
  documentTypes: ['internationalizedPost'],
  migrate: {
    document(doc) {
      // Note: If a document has incoming strong references, it can't be deleted by this script.
      return del(doc._id)
    },
  },
})
