import {defineField, defineType} from 'sanity'

/**
 * Document type used to reproduce
 * https://github.com/sanity-io/plugins/issues/520
 *
 * The bug: when the items of an internationalized array are stored in a
 * different order than the master `languages` config (e.g. pushed via the
 * API in randomized `_key` order), opening the document in a read-only
 * Studio perspective (e.g. the *published* version of a doc that was
 * created/updated via a release) makes the field crash with
 * `"Attempted to patch a read-only document"`.
 *
 * Seed the misordered document with:
 *   pnpm --filter test-studio seed:issue-520
 *
 * Then open it in the `home` workspace and switch the perspective
 * to the published version.
 */
export const issue520Repro = defineType({
  name: 'issue520Repro',
  title: 'Issue #520 reproduction',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'localized',
      title: 'Localized text (out-of-order key set by seed script)',
      type: 'internationalizedArrayString',
    }),
  ],
})
