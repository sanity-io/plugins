import type {ComponentType} from 'react'
import type {PortableTextPluginsProps} from 'sanity'

import {BlockInsertPicker} from './blockInsertPicker'
import type {MarkdownInputRuleConfig} from './inputRules'
import {MarkdownInputRules} from './markdownInputRules'
import type {PickerInsertEvent, PickerItemMetadata} from './types'

export interface BlockInsertPickerOptions {
  /**
   * Name of the portable text array type the picker is mounted on. Items,
   * presentation (title/icon), initial values, and the input-rule allow-list
   * all resolve against that array's member types, so the picker only ever
   * offers blocks the field actually accepts.
   */
  arrayTypeName: string
  /**
   * Per-member curation (slash trigger, alias keywords, section grouping,
   * description) merged into the items derived from the array's members;
   * array order is the sort rank. Members without an entry still get picker
   * items, appended in schema order.
   */
  items?: readonly PickerItemMetadata[]
  /**
   * Markdown-style transforms (for example from the {@link codeFenceRule} and
   * {@link blockquoteRule} factories) that replace typed text with an
   * inserted block, as one undo step. Rules targeting block types the array
   * does not allow are ignored.
   */
  inputRules?: readonly MarkdownInputRuleConfig[]
  /**
   * Notified after each successful insert — picker selection or input rule —
   * alongside the built-in open-for-editing behavior.
   */
  onItemInserted?: (event: PickerInsertEvent) => void
}

/**
 * Creates the Portable Text editor plugins component for the block-insert
 * picker: a slash-command / Cmd+/ menu of the blocks the host array allows,
 * plus optional markdown input rules. Attach it to the array type's
 * `components.portableText.plugins`:
 *
 * ```ts
 * defineType({
 *   name: 'content',
 *   type: 'array',
 *   of: [{type: 'block'}, {type: 'callout'}],
 *   components: {
 *     portableText: {
 *       plugins: blockInsertPicker({arrayTypeName: 'content'}),
 *     },
 *   },
 * })
 * ```
 */
export function blockInsertPicker(
  options: BlockInsertPickerOptions,
): ComponentType<PortableTextPluginsProps> {
  const {arrayTypeName, inputRules, items, onItemInserted} = options
  return function BlockInsertPickerPlugins(props: PortableTextPluginsProps) {
    return (
      <>
        {props.renderDefault(props)}
        {inputRules?.length ? (
          <MarkdownInputRules
            arrayTypeName={arrayTypeName}
            onItemInserted={onItemInserted}
            rules={inputRules}
          />
        ) : null}
        <BlockInsertPicker
          arrayTypeName={arrayTypeName}
          items={items}
          onItemInserted={onItemInserted}
        />
      </>
    )
  }
}
