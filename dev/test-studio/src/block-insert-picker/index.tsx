import {blockInsertPicker, blockquoteRule, codeFenceRule} from '@sanity/block-insert-picker'
import {CodeIcon} from '@sanity/icons/Code'
import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {defineArrayMember, defineField, definePlugin, defineType} from 'sanity'

const callout = defineType({
  name: 'blockInsertPickerCallout',
  title: 'Callout',
  type: 'object',
  icon: InfoOutlineIcon,
  description: 'Call attention to something important',
  fields: [
    defineField({
      name: 'tone',
      type: 'string',
      options: {layout: 'radio', list: ['info', 'tip', 'warning']},
      initialValue: 'info',
    }),
    defineField({name: 'text', type: 'text', rows: 2}),
  ],
  preview: {
    select: {title: 'text', subtitle: 'tone'},
  },
})

const codeSnippet = defineType({
  name: 'blockInsertPickerCode',
  title: 'Code Snippet',
  type: 'object',
  icon: CodeIcon,
  description: 'A fenced code sample',
  fields: [
    defineField({name: 'language', type: 'string', initialValue: 'typescript'}),
    defineField({name: 'filename', type: 'string'}),
    defineField({name: 'source', type: 'text', rows: 4}),
  ],
  preview: {
    select: {title: 'filename', subtitle: 'language'},
  },
})

// The values the fence rule resolves "```<token>" against; tokens outside the
// table pass through as typed.
const languages = [
  {value: 'javascript', aliases: ['js'], filename: 'index.js'},
  {value: 'json', filename: 'data.json'},
  {value: 'python', aliases: ['py'], filename: 'main.py'},
  {value: 'sh', aliases: ['bash', 'shell'], filename: 'terminal'},
  {value: 'typescript', aliases: ['ts'], filename: 'index.ts'},
]

const content = defineType({
  name: 'blockInsertPickerContent',
  title: 'Content',
  type: 'array',
  of: [
    defineArrayMember({type: 'block'}),
    defineArrayMember({type: 'blockInsertPickerCallout'}),
    defineArrayMember({type: 'blockInsertPickerCode'}),
    defineArrayMember({type: 'image'}),
  ],
  components: {
    portableText: {
      // Zero config would already work here: the picker detects this array
      // and derives an item per member. The metadata below only curates
      // triggers, keywords, grouping, and rank.
      plugins: blockInsertPicker({
        items: [
          {
            type: 'blockInsertPickerCode',
            trigger: '/code',
            keywords: ['snippet', 'syntax'],
            group: 'Code',
          },
          {
            type: 'blockInsertPickerCallout',
            trigger: '/callout',
            keywords: ['note', 'warning', 'tip'],
            group: 'Callouts',
          },
          // No trigger/keywords: the built-in `image` preset fills them in.
          {type: 'image', group: 'Media'},
        ],
        inputRules: [
          // "```py " inserts a code snippet with the language (and a tab
          // filename) prefilled; "> " inserts an info callout.
          codeFenceRule({
            blockType: 'blockInsertPickerCode',
            defaultLanguage: 'typescript',
            languages,
            createValue: ({filename, language}) => ({
              language,
              ...(filename ? {filename} : {}),
            }),
          }),
          blockquoteRule({
            blockType: 'blockInsertPickerCallout',
            createValue: () => ({tone: 'info'}),
          }),
        ],
      }),
    },
  },
})

const blockInsertPickerTest = defineType({
  name: 'blockInsertPickerTest',
  title: 'Block Insert Picker',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string'}),
    defineField({name: 'content', type: 'blockInsertPickerContent'}),
  ],
})

export const blockInsertPickerExample = definePlugin(() => ({
  name: 'block-insert-picker-example',
  schema: {types: [callout, codeSnippet, content, blockInsertPickerTest]},
}))
