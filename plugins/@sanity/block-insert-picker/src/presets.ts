import {typeNameChain} from './deriveItems'
import {codeFenceRule, type MarkdownInputRuleConfig} from './inputRules'
import type {PickerItem, PickerItemMetadata, PickerItemsContext} from './types'

/**
 * Default triggers and search keywords for block types with fixed, official
 * names: Studio's intrinsic types (`image`, `file`), first-party plugin
 * types (`code`, `table`, `color`, `latex`, `mux.video`), and the Media
 * Library's `sanity.video`. Presets are deliberately presentation-only —
 * they never add items (a type must actually be a member of the array),
 * never set groups (partial grouping would strand unmatched items in an
 * "Other" bucket), never affect rank, and always lose to a host's `items`
 * entry for the same type. Opt out entirely with `presets: false`.
 */
export const standardBlockPresets: readonly PickerItemMetadata[] = [
  {keywords: ['photo', 'picture', 'figure', 'media'], trigger: '/image', type: 'image'},
  {keywords: ['attachment', 'download', 'document'], trigger: '/file', type: 'file'},
  {keywords: ['snippet', 'syntax', 'fence', 'pre'], trigger: '/code', type: 'code'},
  {keywords: ['grid', 'rows', 'columns', 'spreadsheet'], trigger: '/table', type: 'table'},
  {keywords: ['swatch', 'palette'], trigger: '/color', type: 'color'},
  {keywords: ['formula', 'equation', 'math', 'tex', 'katex'], trigger: '/latex', type: 'latex'},
  {keywords: ['video', 'player', 'mux'], trigger: '/video', type: 'mux.video'},
  {keywords: ['video', 'player', 'media'], trigger: '/video', type: 'sanity.video'},
]

/**
 * Opt-in input rules for well-known block types — spread into `inputRules`
 * (`inputRules: [...wellKnownInputRules]`) rather than applied by default.
 * Today: a code fence for `@sanity/code-input`'s `code` type that stores the
 * typed fence token as the language. Like all rules, each resolves against
 * the array's members by name or resolved type chain (so an aliased
 * `{type: 'code', name: 'snippet'}` member still gets the fence, inserted
 * with the member's `_type`) and is ignored when nothing matches.
 */
export const wellKnownInputRules: readonly MarkdownInputRuleConfig[] = [
  codeFenceRule({
    blockType: 'code',
    createValue: ({language}) => (language ? {language} : {}),
  }),
]

/**
 * Fills preset triggers and keywords into derived items that don't already
 * have them, matching presets against each member's resolved type chain so
 * `{type: 'image', name: 'photo'}` still gets the image preset. Host `items`
 * metadata has already been folded in by derivePickerItems, so anything it
 * set wins by construction.
 */
export function applyPresetMetadata(
  items: readonly PickerItem[],
  context: PickerItemsContext,
  presets: readonly PickerItemMetadata[] = standardBlockPresets,
): PickerItem[] {
  const presetByType = new Map(presets.map((preset) => [preset.type, preset]))
  return items.map((item) => {
    if (item.action.type !== 'insertBlock') return item
    if (item.trigger !== undefined && item.keywords !== undefined) return item
    const blockType = item.action.blockType
    const memberType = context.memberTypes.find((candidate) => candidate.name === blockType)
    if (!memberType) return item
    const preset = typeNameChain(memberType)
      .map((name) => presetByType.get(name))
      .find(Boolean)
    if (!preset) return item
    return {
      ...item,
      keywords: item.keywords ?? preset.keywords,
      trigger: item.trigger ?? preset.trigger,
    }
  })
}
