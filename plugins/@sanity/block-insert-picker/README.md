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

Requires `sanity` v5.6 or later.

## Usage

Attach the picker to a Portable Text array type via `components.portableText.plugins`. Zero config is the intended call — the picker detects the array it is mounted on and derives its items from that array's members, so it only ever offers blocks the field accepts:

```ts
import {blockInsertPicker} from '@sanity/block-insert-picker'
import {defineType} from 'sanity'

export const content = defineType({
  name: 'content',
  type: 'array',
  of: [{type: 'block'}, {type: 'callout'}, {type: 'codeBlock'}],
  components: {
    portableText: {
      plugins: blockInsertPicker(),
    },
  },
})
```

Titles, icons, and descriptions come from each member's schema type (with the same fallbacks Studio's built-in insert menu uses), and detection handles aliased members (`{type: 'image', name: 'photo'}`) and inline-declared members with full fidelity.

When an array derives zero items — its only member is the text block — and no `inputRules` are configured, the picker disables itself: no behaviors register and `/` inserts plain text (with a `console.warn` in dev builds). Items appended via `resolveItems` (or configured `inputRules`) re-enable it, so a custom-command-only picker on a text-only field works.

### Curating items

The optional `items` metadata curates the derived items — slash triggers, alias keywords, section grouping, badges, per-item visibility, and rank (array order). Entries match a member's name or any name in its resolved type chain, and a curated `description` wins over the schema type's:

```ts
blockInsertPicker({
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
    {type: 'legacyEmbed', hidden: true},
  ],
})
```

Members without an entry still get picker items, appended in schema order. Entries whose `type` matches no member log a dev-mode warning.

### Presets for well-known blocks

Members whose type resolves to a well-known name — `image`, `file`, `code` (`@sanity/code-input`), `table`, `color`, `latex`, `mux.video`, `sanity.video` — get default triggers and search keywords out of the box. Presets never add items, never group, and always lose to your `items` metadata. Opt out with `presets: false`.

### Markdown input rules

`inputRules` adds typed transforms that replace markdown-style text with an inserted block — one undo step, and the block opens for editing just like a picker insert. Rules are opt-in; two factories cover the common cases:

````ts
import {blockInsertPicker, blockquoteRule, codeFenceRule} from '@sanity/block-insert-picker'

blockInsertPicker({
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

`createValue` builds the inserted block's fields synchronously from the resolved fence language (and optional tab filename), shaped for **your** schema. Each rule's `blockType` resolves against the array's members by name or resolved type chain (aliased members included; the inserted `_type` is always the member name); rules matching nothing are ignored. For fully custom transforms, pass a `{pattern, blockType, buildValue}` config directly. A ready-made `wellKnownInputRules` bundle covers `@sanity/code-input`'s `code` type: `inputRules: [...wellKnownInputRules]`.

### Reacting to inserts

`onInsert` fires after every successful insert, from either path:

```ts
blockInsertPicker({
  onInsert: ({blockKey, blockType, via, mode, query}) => {
    // via is 'picker' or 'inputRule'; mode and query are picker-only
  },
})
```

### Escape hatches

For anything the declarative options don't cover:

- **`resolveItems`** — a function over the fully-presented item list: reorder, remove, relabel, or append items. Appended items can carry a `custom` action that runs your code instead of inserting a block:

  ```ts
  blockInsertPicker({
    resolveItems: (items, {schemaType}) => [
      ...items,
      {
        id: 'ai-draft',
        title: 'Draft with AI',
        action: {type: 'custom', onSelect: ({editor}) => startDraft(editor)},
      },
    ],
  })
  ```

- **`filter`** — replaces the built-in matching (case-insensitive substring over title, keywords, and description, plus trigger prefixes). It receives the bare query in both modes; the slash-mode `/` prefix is stripped.
- **`labels`** — overrides any user-facing string in the picker chrome (header, empty state, footer hints, error toast), for reworded or translated UI.
- **`shortcut: false`** — disables the `Cmd`/`Ctrl` + `/` shortcut; `openOnInsert: false` — keeps inserted blocks closed (also available per item via metadata).
- **`BlockInsertPicker` / `MarkdownInputRules`** — the underlying components, exported for hosts composing their own `components.portableText.plugins` chain, along with the pure `derivePickerItems` and `filterPickerItems` utilities.
- **`arrayTypeName`** — names the array type explicitly, for environments where the member-schema context is unavailable. Normally unnecessary.

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
