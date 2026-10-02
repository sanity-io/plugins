import {defineField, defineType} from 'sanity'

/**
 * Documents used to reproduce
 * https://github.com/sanity-io/plugins/issues/912
 *
 * `issue912Repro`: Translate fields overwrites `slug` even though it is
 * `readOnly: true`.
 * `issue912ExcludeRepro`: the same action fails because `sku` is
 * `options.aiAssist.exclude: true` and is omitted from the serialized schema.
 *
 * Seed both drafts with the Scripts tool: Seed issue #912 repro.
 */

export const ISSUE_912_DOCUMENT_ID = 'issue-912-repro'
export const ISSUE_912_EXCLUDE_DOCUMENT_ID = 'issue-912-exclude-repro'

export function internationalizedString(language: string, value: string) {
  return {
    _key: language,
    _type: 'internationalizedArrayStringValue' as const,
    language,
    value,
  }
}

export const issue912EnglishValues = {
  title: [internationalizedString('en', 'Hello')],
  slug: [internationalizedString('en', 'hello')],
  sku: [internationalizedString('en', 'SKU-1')],
}

export const issue912Repro = defineType({
  name: 'issue912Repro',
  title: 'Issue #912 reproduction',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title (writable)',
      type: 'internationalizedArrayString',
      description: 'Control. Translate fields should add the other languages here.',
    }),
    defineField({
      name: 'slug',
      title: 'Slug (readOnly: true)',
      type: 'internationalizedArrayString',
      description:
        'Must stay "hello" in English only. Translate fields currently overwrites this field.',
      readOnly: true,
    }),
  ],
  initialValue: {
    title: issue912EnglishValues.title,
    slug: issue912EnglishValues.slug,
  },
})

export const issue912ExcludeRepro = defineType({
  name: 'issue912ExcludeRepro',
  title: 'Issue #912 exclude reproduction',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title (writable)',
      type: 'internationalizedArrayString',
      description: 'Control. Present so Translate fields has a path it can resolve.',
    }),
    defineField({
      name: 'sku',
      title: 'SKU (aiAssist.exclude)',
      type: 'internationalizedArrayString',
      description:
        'Excluded from AI Assist. Translate fields currently fails with: No schema exists for segment "sku".',
      options: {
        aiAssist: {
          exclude: true,
        },
      },
    }),
  ],
  initialValue: {
    title: issue912EnglishValues.title,
    sku: issue912EnglishValues.sku,
  },
})
