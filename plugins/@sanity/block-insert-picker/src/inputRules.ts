import {effect, raise} from '@portabletext/editor/behaviors'
import {blockOffsetsToSelection} from '@portabletext/editor/utils'
import {defineInputRule, type InputRule} from '@portabletext/plugin-input-rule'

/**
 * Generic machinery for markdown-style input rules that replace typed text
 * with an inserted object block, complementing the slash/⌘+/ picker with a
 * keyboard-only path that mirrors what writers already type in markdown.
 *
 * The rules run through `@portabletext/plugin-input-rule` (see
 * `markdownInputRules.tsx`), which applies the delete + insert as a single
 * behavior action set — so each transform is one undo step.
 *
 * Block values are built synchronously via each config's `buildValue` rather
 * than resolved from the schema's async initial values: the insert has to
 * happen inside the rule's action set for that single-undo guarantee to hold,
 * so anything the writer would otherwise have to fill in (language, filename,
 * callout type) is seeded from the host's rule config.
 */

export type KeyGenerator = () => string

/**
 * One markdown input rule: when `pattern` matches the block text, the match
 * is deleted and a block of `blockType` is inserted in its place, carrying
 * the fields `buildValue` returns. `buildValue` must stay synchronous so the
 * delete + insert land in one action set (one undo step).
 */
export type MarkdownInputRuleConfig = {
  pattern: RegExp
  blockType: string
  buildValue: (context: {matchText: string; keyGenerator: KeyGenerator}) => Record<string, unknown>
}

type BuildRulesDeps = {
  keyGenerator: KeyGenerator
  /** Called with the inserted block so the caller can open it for editing. */
  onInserted: (block: InsertableBlock) => void
}

type InsertableBlock = {_key: string; _type: string} & Record<string, unknown>

/**
 * Builds InputRules for the configs whose block type the host array actually
 * allows, so a rule can't insert a block the field would reject.
 */
export function createMarkdownInputRules({
  allowedBlockTypes,
  keyGenerator,
  onInserted,
  rules,
}: BuildRulesDeps & {
  allowedBlockTypes: ReadonlySet<string>
  rules: readonly MarkdownInputRuleConfig[]
}): InputRule[] {
  return rules
    .filter((config) => allowedBlockTypes.has(config.blockType))
    .map((config) => createInsertRule(config, keyGenerator, onInserted))
}

// The plugin matches its regex against the block text AFTER the pending
// insertion. The trailing "\s" is the space the writer types to commit the
// fence/quote; it is part of the match and gets deleted along with it.
export const CODE_FENCE_PATTERN = /^`{3}\S*\s$/
export const BLOCKQUOTE_PATTERN = /^>\s$/

/**
 * A row of a code-fence language table: the stored `value`, the markdown
 * fence tokens that should resolve to it, and an optional tab filename.
 */
export type LanguageEntry = {
  value: string
  aliases?: readonly string[]
  filename?: string
}

/** Sugar: a blockquote rule ("> " at the start of a block) for `blockType`. */
export function blockquoteRule(options: {
  blockType: string
  createValue?: (context: {keyGenerator: KeyGenerator}) => Record<string, unknown>
}): MarkdownInputRuleConfig {
  return {
    blockType: options.blockType,
    buildValue: ({keyGenerator}) => options.createValue?.({keyGenerator}) ?? {},
    pattern: BLOCKQUOTE_PATTERN,
  }
}

/**
 * Sugar: a code-fence rule ("```lang␣") for `blockType`. The language table
 * resolves fence tokens (aliases included) to the values the block's language
 * selector stores, plus an optional filename; tokens outside the table pass
 * through as typed so nothing the writer means is lost. `createValue` turns
 * the resolved language and filename into the block's fields.
 */
export function codeFenceRule(options: {
  blockType: string
  languages?: readonly LanguageEntry[]
  defaultLanguage?: string
  createValue: (context: {
    filename: string | undefined
    keyGenerator: KeyGenerator
    language: string | undefined
  }) => Record<string, unknown>
}): MarkdownInputRuleConfig {
  const languages = options.languages ?? []
  return {
    blockType: options.blockType,
    buildValue: ({keyGenerator, matchText}) => {
      const language = normalizeFenceLanguage(
        fenceLanguageFromMatch(matchText),
        languages,
        options.defaultLanguage,
      )
      const filename = language
        ? languages.find((entry) => entry.value === language)?.filename
        : undefined
      return options.createValue({filename, keyGenerator, language})
    },
    pattern: CODE_FENCE_PATTERN,
  }
}

/** Strips the leading "```" fence and surrounding whitespace from a match. */
export function fenceLanguageFromMatch(matchText: string): string {
  return matchText.replace(/^`{3}/, '').trim()
}

/**
 * Resolves a typed fence token against a language table: a canonical value,
 * an alias (`py`→python, `yml`→yaml), or — for anything the table doesn't
 * know — the token as typed. An empty token yields `defaultLanguage`.
 */
export function normalizeFenceLanguage(
  raw: string,
  languages: readonly LanguageEntry[],
  defaultLanguage?: string,
): string | undefined {
  const lower = raw.trim().toLowerCase()
  if (!lower) return defaultLanguage
  for (const {aliases, value} of languages) {
    if (value === lower || aliases?.includes(lower)) return value
  }
  return lower
}

function createInsertRule(
  config: MarkdownInputRuleConfig,
  keyGenerator: KeyGenerator,
  onInserted: (block: InsertableBlock) => void,
): InputRule {
  return defineInputRule({
    actions: [
      ({event, snapshot}) => {
        const match = event.matches[0]
        if (!match) return []
        const block: InsertableBlock = {
          _key: keyGenerator(),
          _type: config.blockType,
          ...config.buildValue({keyGenerator, matchText: match.text}),
        }
        // `match.selection` is clamped to the text that existed *before* the
        // triggering space, so it stops short of that space and would leave it
        // orphaned as a stray paragraph next to the inserted block.
        // `match.targetOffsets` spans the full match (space included); convert
        // it to a selection so the whole fence/quote is removed cleanly.
        const at =
          blockOffsetsToSelection({
            offsets: {
              anchor: match.targetOffsets.anchor,
              focus: match.targetOffsets.focus,
            },
            snapshot,
          }) ?? match.selection
        return [
          // Remove the typed fence/quote text, then insert the block in its
          // place. Both raises land in one action set (one undo step).
          raise({at, type: 'delete.text'}),
          raise({
            block,
            placement: 'auto',
            select: 'start',
            type: 'insert.block',
          }),
          effect(() => onInserted(block)),
        ]
      },
    ],
    on: config.pattern,
  })
}
