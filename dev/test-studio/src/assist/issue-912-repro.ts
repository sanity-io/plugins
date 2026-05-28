import {defineField, defineType} from 'sanity'

/**
 * Document type used to reproduce
 * https://github.com/sanity-io/plugins/issues/912
 *
 * The bug: `@sanity/assist`'s "Translate fields" action writes to fields
 * marked statically `readOnly: true`, even though the plugin README and
 * the docs (https://www.sanity.io/docs/user-guides/ai-assist-working-with-instructions)
 * promise:
 *
 *   > AI Assist will ignore any field that is hidden or in read-only mode
 *   > when the instruction starts running.
 *
 * Reported by @rijk against plugin 6.0.7 / Studio 5.27.0. Sometimes the
 * overwritten value is invalid, blocking publish.
 *
 * This schema includes two read-only fields side-by-side with writable
 * equivalents so the contrast is unambiguous when running Translate fields:
 *
 *   - top-level: `title` (writable) vs `readOnlyTitle` (readOnly)
 *   - nested:   `details.body` (writable) vs `details.readOnlyBody` (readOnly)
 *
 * Steps to reproduce (after seeding via the script-runner):
 *
 *   1. Boot `pnpm --filter test-studio dev` and open the `kitchen-sink` workspace.
 *   2. Open the `Issue 912 reproduction` document. Source-language values
 *      (English) are pre-filled by the `seed-issue-912` script.
 *   3. Click "Translate fields...", choose `English` -> `Spanish` (or any
 *      target), and Run.
 *   4. Switch the language selector to the target language and observe.
 *
 *   Expected (per README/docs): `readOnlyTitle` and `details.readOnlyBody`
 *   remain empty in the target language.
 *   Actual: both get translated values written into them.
 */
export const issue912Repro = defineType({
  name: 'issue912Repro',
  title: 'Issue #912 reproduction',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title (writable, expected to be translated)',
      type: 'internationalizedArrayString',
      options: {
        aiAssist: {translateAction: true},
      },
    }),
    defineField({
      name: 'readOnlyTitle',
      title: 'Read-only title (readOnly: true, should be SKIPPED by Translate)',
      description:
        'Statically marked readOnly. Per README/docs the Translate action should leave this untouched. Bug: it writes a translation anyway.',
      type: 'internationalizedArrayString',
      readOnly: true,
      options: {
        aiAssist: {translateAction: true},
      },
    }),
    defineField({
      name: 'details',
      title: 'Details (nested object variant)',
      type: 'object',
      fields: [
        defineField({
          name: 'body',
          title: 'Body (writable)',
          type: 'internationalizedArrayString',
          options: {
            aiAssist: {translateAction: true},
          },
        }),
        defineField({
          name: 'readOnlyBody',
          title: 'Read-only body (readOnly: true, should be SKIPPED by Translate)',
          description:
            'Nested static readOnly inside an object. Same expectation as readOnlyTitle.',
          type: 'internationalizedArrayString',
          readOnly: true,
          options: {
            aiAssist: {translateAction: true},
          },
        }),
      ],
    }),
  ],
})
