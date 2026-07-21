import type {ComponentType} from 'react'
import type {PortableTextPluginsProps} from 'sanity'

import {BlockInsertPicker} from './blockInsertPicker'
import type {MarkdownInputRuleConfig} from './inputRules'
import type {BlockInsertPickerLabels} from './labels'
import {MarkdownInputRules} from './markdownInputRules'
import type {PickerInsertEvent, PickerItem, PickerItemMetadata, PickerItemsResolver} from './types'

export interface BlockInsertPickerConfig {
  /**
   * Per-member curation (slash trigger, alias keywords, section grouping,
   * description, badge, visibility, per-item open-on-insert) merged into the
   * items derived from the array's members; array order is the sort rank.
   * Members without an entry still get picker items, appended in schema
   * order. Entries whose `type` matches no member warn in dev mode.
   */
  items?: readonly PickerItemMetadata[]
  /**
   * Programmatic seam over the derived item list — reorder, remove, relabel,
   * or append items (including `custom`-action items) — running after schema
   * derivation, presets, and `items` metadata.
   */
  resolveItems?: PickerItemsResolver
  /**
   * Markdown-style transforms (for example from the {@link codeFenceRule} and
   * {@link blockquoteRule} factories) that replace typed text with an
   * inserted block, as one undo step. Opt-in only; rules targeting block
   * types the array does not allow are ignored.
   */
  inputRules?: readonly MarkdownInputRuleConfig[]
  /**
   * Replaces the built-in matching (case-insensitive substring over title,
   * keywords, and description, plus trigger prefixes). Receives the bare
   * query in both modes — the slash-mode "/" prefix is stripped.
   */
  filter?: (items: readonly PickerItem[], query: string) => readonly PickerItem[]
  /** Overrides for the picker chrome's user-facing strings. */
  labels?: Partial<BlockInsertPickerLabels>
  /**
   * Notified after each successful insert — picker selection or input rule —
   * alongside the built-in open-for-editing behavior.
   */
  onInsert?: (event: PickerInsertEvent) => void
  /**
   * Whether an inserted block opens for editing (default true). Items can
   * override per member via their metadata's `openOnInsert`.
   */
  openOnInsert?: boolean
  /** Whether Cmd/Ctrl+/ opens the picker (default true). */
  shortcut?: boolean
  /**
   * Whether well-known block types (image, file, code, table, ...) get
   * default triggers and keywords when `items` doesn't cover them
   * (default true). See {@link standardBlockPresets}.
   */
  presets?: boolean
  /**
   * Escape hatch: names the portable-text array type to resolve items
   * against when Studio's member-schema context is unavailable. Normally
   * unnecessary — the containing array and its members are detected
   * automatically from where the plugin is mounted.
   */
  arrayTypeName?: string
}

/**
 * Creates the Portable Text editor plugins component for the block-insert
 * picker: a slash-command / Cmd+/ menu of the blocks the host array allows,
 * plus optional markdown input rules. Zero-config is the intended call —
 * items derive from the array the plugin is mounted on. Attach it to the
 * array type's `components.portableText.plugins`:
 *
 * ```ts
 * defineType({
 *   name: 'content',
 *   type: 'array',
 *   of: [{type: 'block'}, {type: 'callout'}],
 *   components: {
 *     portableText: {
 *       plugins: blockInsertPicker(),
 *     },
 *   },
 * })
 * ```
 */
export function blockInsertPicker(
  config: BlockInsertPickerConfig = {},
): ComponentType<PortableTextPluginsProps> {
  const {
    arrayTypeName,
    filter,
    inputRules,
    items,
    labels,
    onInsert,
    openOnInsert,
    presets,
    resolveItems,
    shortcut,
  } = config
  return function BlockInsertPickerPlugins(props: PortableTextPluginsProps) {
    return (
      <>
        {props.renderDefault(props)}
        {inputRules?.length ? (
          <MarkdownInputRules
            arrayTypeName={arrayTypeName}
            onInsert={onInsert}
            openOnInsert={openOnInsert}
            rules={inputRules}
          />
        ) : null}
        <BlockInsertPicker
          arrayTypeName={arrayTypeName}
          filter={filter}
          items={items}
          labels={labels}
          onInsert={onInsert}
          openOnInsert={openOnInsert}
          presets={presets}
          resolveItems={resolveItems}
          shortcut={shortcut}
        />
      </>
    )
  }
}
