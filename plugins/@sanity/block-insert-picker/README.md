# @sanity/block-insert-picker

Slash-command block-insert picker and markdown input rules for Portable Text fields in Sanity Studio.

Type `/` at the start of a line (or press `Cmd`/`Ctrl` + `/` anywhere) to open a caret-anchored menu of every object block the field's schema allows — searchable by title, trigger, and alias keywords, grouped into sections, keyboard-first. Selecting an item resolves the member type's initial value, inserts the block as a single undo step, and opens it for editing. Optional markdown input rules give the heaviest block types an even faster path, for example ` ```ts ` + space straight into a code block.

## Installation

```bash
npm install --save @sanity/block-insert-picker
```

or

```bash
pnpm add @sanity/block-insert-picker
```

or

```
yarn add @sanity/block-insert-picker
```

## Usage

Attach the picker to a **named** Portable Text array type via `components.portableText.plugins`. Items derive from the array's members, so the picker only ever offers blocks the field accepts:

```ts
import {blockInsertPicker} from '@sanity/block-insert-picker'
import {defineType} from 'sanity'

export const content = defineType({
  name: 'content',
  type: 'array',
  of: [{type: 'block'}, {type: 'callout'}, {type: 'codeBlock'}],
  components: {
    portableText: {
      plugins: blockInsertPicker({arrayTypeName: 'content'}),
    },
  },
})
```

Titles, icons, and descriptions come from each member's schema type. The optional `items` metadata curates everything else — slash triggers, alias keywords, section grouping, and rank (array order):

```ts
blockInsertPicker({
  arrayTypeName: 'content',
  items: [
    {
      type: 'codeBlock',
      trigger: '/code',
      keywords: ['snippet', 'syntax'],
      group: 'Code',
      description: 'Syntax-highlighted code sample',
    },
    {
      type: 'callout',
      trigger: '/callout',
      keywords: ['note', 'warning', 'tip'],
      group: 'Callouts',
    },
  ],
})
```

Members without an entry still get picker items, appended in schema order.

### Markdown input rules

`inputRules` adds typed transforms that replace markdown-style text with an inserted block — one undo step, and the block opens for editing just like a picker insert. Two factories cover the common cases:

````ts
import {blockInsertPicker, blockquoteRule, codeFenceRule} from '@sanity/block-insert-picker'

blockInsertPicker({
  arrayTypeName: 'content',
  inputRules: [
    // "```lang" + space inserts a code block with the language resolved
    codeFenceRule({
      blockType: 'codeBlock',
      defaultLanguage: 'typescript',
      languages: [
        {value: 'typescript', aliases: ['ts'], filename: 'index.ts'},
        {value: 'javascript', aliases: ['js'], filename: 'index.js'},
      ],
      createValue: ({language, filename}) => ({
        language,
        ...(filename ? {filename} : {}),
      }),
    }),
    // "> " at the start of a block inserts a quote/callout
    blockquoteRule({
      blockType: 'callout',
      createValue: () => ({tone: 'info'}),
    }),
  ],
})
````

`createValue` builds the inserted block's fields synchronously from the resolved fence language (and optional tab filename), shaped for **your** schema. Rules targeting block types the array does not allow are ignored. For fully custom transforms, pass a `{pattern, blockType, buildValue}` config directly.

### Reacting to inserts

`onItemInserted` fires after every successful insert, from either path:

```ts
blockInsertPicker({
  arrayTypeName: 'content',
  onItemInserted: ({blockKey, blockType, via}) => {
    // via is 'picker' or 'inputRule'
  },
})
```

## Keyboard reference

| Key                | Action                                             |
| ------------------ | -------------------------------------------------- |
| `/` at line start  | Open the picker; keep typing to filter             |
| `Cmd`/`Ctrl` + `/` | Open the picker anywhere; type to filter privately |
| `↑` / `↓`          | Move the highlight                                 |
| `Enter`            | Insert the highlighted block                       |
| `Escape`           | Dismiss                                            |

## License

[MIT](LICENSE) © Sanity.io
