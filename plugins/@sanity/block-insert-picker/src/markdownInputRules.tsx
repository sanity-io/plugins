import {useEditor} from '@portabletext/editor'
import {defineInputRuleBehavior} from '@portabletext/plugin-input-rule'
import {useEffect, useLayoutEffect, useMemo, useRef} from 'react'
import {useSchema} from 'sanity'

import {createMarkdownInputRules, type MarkdownInputRuleConfig} from './inputRules'
import {useOpenBlockOnInsert} from './openBlockOnInsert'
import type {PickerInsertEvent} from './types'

type MarkdownInputRulesProps = {
  /**
   * Name of the portable-text array type this plugin is mounted on. Rules are
   * only enabled for block types the array actually allows.
   */
  arrayTypeName?: string
  /** The markdown transforms to enable (see inputRules.ts). */
  rules: readonly MarkdownInputRuleConfig[]
  /** Notified after each successful insert, alongside the built-in open-on-insert. */
  onItemInserted?: (event: PickerInsertEvent) => void
}

/**
 * Mounts markdown input rules on the PTE and opens each inserted block for
 * editing once its member item mounts — the same open-on-insert behavior the
 * picker uses, so a fenced code block lands ready to type into.
 */
export function MarkdownInputRules({
  arrayTypeName,
  onItemInserted,
  rules,
}: MarkdownInputRulesProps) {
  const editor = useEditor()
  const schema = useSchema()
  const openBlockOnInsert = useOpenBlockOnInsert()

  const allowedBlockTypes = useMemo(() => {
    const arrayType = arrayTypeName ? schema.get(arrayTypeName) : undefined
    if (!arrayType || arrayType.jsonType !== 'array') return new Set<string>()
    return new Set(arrayType.of.map((member) => member.name))
  }, [arrayTypeName, schema])

  // The insert callbacks are routed through a ref (same pattern as
  // BlockInsertPicker's handleIntentRef) so the registration effect below
  // stays keyed on the rules/schema/editor only: re-registering a behavior
  // is not free (it tears down and re-sorts the editor's behavior chain, and
  // moves this behavior after later-registered ones), so a host passing an
  // inline onItemInserted must not cause per-render churn.
  const onInsertedRef = useRef<(block: {_key: string; _type: string}) => void>(() => {})
  useLayoutEffect(() => {
    onInsertedRef.current = (block) => {
      openBlockOnInsert(block._key)
      onItemInserted?.({
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
      allowedBlockTypes,
      // The generator is read per insert so keys stay unique across a session.
      keyGenerator: () => editor.getSnapshot().context.keyGenerator(),
      onInserted: (block) => onInsertedRef.current(block),
      rules,
    })
    if (inputRules.length === 0) return undefined
    return editor.registerBehavior({
      behavior: defineInputRuleBehavior({rules: inputRules}),
    })
  }, [allowedBlockTypes, editor, rules])

  return null
}
