import {useEditor} from '@portabletext/editor'
import {defineInputRuleBehavior} from '@portabletext/plugin-input-rule'
import {useEffect, useLayoutEffect, useMemo, useRef} from 'react'

import {typeNameChain} from './deriveItems'
import {createMarkdownInputRules, type MarkdownInputRuleConfig} from './inputRules'
import {usePickerItemsContext} from './memberSchemaTypes'
import {useOpenBlockOnInsert} from './openBlockOnInsert'
import type {PickerInsertEvent} from './types'

export type MarkdownInputRulesProps = {
  /**
   * Escape hatch: names the portable-text array type when Studio's
   * member-schema context is unavailable (see BlockInsertPickerProps).
   * Rules are only enabled for block types the array actually allows.
   */
  arrayTypeName?: string
  /** The markdown transforms to enable (see inputRules.ts). */
  rules: readonly MarkdownInputRuleConfig[]
  /** Notified after each successful insert, alongside open-on-insert. */
  onInsert?: (event: PickerInsertEvent) => void
  /** Whether an inserted block opens for editing (default true). */
  openOnInsert?: boolean
}

/**
 * Mounts markdown input rules on the PTE and opens each inserted block for
 * editing once its member item mounts — the same open-on-insert behavior the
 * picker uses, so a fenced code block lands ready to type into.
 */
export function MarkdownInputRules({
  arrayTypeName,
  onInsert,
  openOnInsert = true,
  rules,
}: MarkdownInputRulesProps) {
  const editor = useEditor()
  const itemsContext = usePickerItemsContext(arrayTypeName)
  const openBlockOnInsert = useOpenBlockOnInsert()

  // Rules resolve against the array's insertable members with the same
  // precedence as picker item metadata: a rule's blockType matches a member
  // by name first, then by any name in the member's resolved type chain — so
  // wellKnownInputRules' `code` fence also serves `{type: 'code', name:
  // 'snippet'}`, with the inserted `_type` rewritten to the member name the
  // array actually accepts. Rules matching nothing are dropped here, which
  // also keeps `block` itself (and aliased text blocks) unreachable.
  const resolvedRules = useMemo(() => {
    const memberTypes = itemsContext?.memberTypes ?? []
    return rules.flatMap((rule) => {
      const member =
        memberTypes.find((candidate) => candidate.name === rule.blockType) ??
        memberTypes.find((candidate) => typeNameChain(candidate).includes(rule.blockType))
      if (!member) return []
      return [rule.blockType === member.name ? rule : {...rule, blockType: member.name}]
    })
  }, [itemsContext, rules])

  // The insert callbacks are routed through a ref (same pattern as
  // BlockInsertPicker's handleIntentRef) so the registration effect below
  // stays keyed on the rules/schema/editor only: re-registering a behavior
  // is not free (it tears down and re-sorts the editor's behavior chain, and
  // moves this behavior after later-registered ones), so a host passing an
  // inline onInsert must not cause per-render churn.
  const onInsertedRef = useRef<(block: {_key: string; _type: string}) => void>(() => {})
  useLayoutEffect(() => {
    onInsertedRef.current = (block) => {
      if (openOnInsert) openBlockOnInsert(block._key)
      onInsert?.({
        blockKey: block._key,
        blockType: block._type,
        via: 'inputRule',
      })
    }
  })

  // Register the input-rule behavior imperatively rather than through the
  // <InputRulePlugin>
  // component: the rule closures then live inside an effect and can schedule
  // the open-on-insert without hitting the React Compiler's "no refs during
  // render" rule. Each transform is still a single undo step (the plugin
  // applies the delete + insert as one behavior action set).
  useEffect(() => {
    const inputRules = createMarkdownInputRules({
      // resolvedRules are already narrowed to insertable members.
      allowedBlockTypes: new Set(resolvedRules.map((rule) => rule.blockType)),
      // The generator is read per insert so keys stay unique across a session.
      keyGenerator: () => editor.getSnapshot().context.keyGenerator(),
      onInserted: (block) => onInsertedRef.current(block),
      rules: resolvedRules,
    })
    if (inputRules.length === 0) return undefined
    return editor.registerBehavior({
      behavior: defineInputRuleBehavior({rules: inputRules}),
    })
  }, [editor, resolvedRules])

  return null
}
