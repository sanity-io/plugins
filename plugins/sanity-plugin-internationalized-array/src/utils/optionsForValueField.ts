/**
 * Option keys this plugin stores on the internationalized array type.
 * They configure languages and validation, and are not options of the
 * underlying value field (string, file, image, and so on).
 */
const PLUGIN_OPTION_KEYS = new Set(['apiVersion', 'languages', 'select'])

/** Sanity collapses a field automatically once it is nested this deep. */
const AUTO_COLLAPSE_DEPTH = 3

const COLLAPSE_OPTION_KEYS = ['collapsed', 'collapsible', 'collapsable'] as const

function isOptionRecord(options: unknown): options is Record<string, unknown> {
  return typeof options === 'object' && options !== null && !Array.isArray(options)
}

/**
 * Options from an `internationalizedArray*` field that should be applied to
 * each language row's `value` field.
 *
 * Sanity compiles field `options` onto the array field only. The shared value
 * type never sees them, so `accept`, `collapsed`, `hotspot`, `list`, and
 * similar settings have to be copied when the row renders. Plugin keys stay
 * on the array. Field-usage options override options already set on the value
 * field via `fieldTypes`.
 */
export function optionsForValueField(
  arrayFieldOptions: unknown,
  valueFieldOptions: unknown,
): Record<string, unknown> | undefined {
  const valueOptions = isOptionRecord(valueFieldOptions) ? valueFieldOptions : undefined

  if (!isOptionRecord(arrayFieldOptions)) {
    return valueOptions
  }

  let forwarded: Record<string, unknown> | undefined
  for (const [key, value] of Object.entries(arrayFieldOptions)) {
    if (PLUGIN_OPTION_KEYS.has(key)) {
      continue
    }
    forwarded ??= {}
    forwarded[key] = value
  }

  if (!forwarded) {
    return valueOptions
  }

  return {...valueOptions, ...forwarded}
}

export type CollapseFlags = {
  collapsed: boolean | undefined
  collapsible: boolean | undefined
}

/**
 * Same rules as Studio's `getCollapsedWithDefaults`, which is not exported.
 * `collapsed: true` also marks the field collapsible, so it can be opened again.
 */
function optionEquals(
  record: Record<string, unknown> | undefined,
  key: string,
  value: boolean,
): boolean {
  return record?.[key] === value
}

export function collapseStateFromOptions(options: unknown, level: number): CollapseFlags {
  const record = isOptionRecord(options) ? options : undefined

  if (optionEquals(record, 'collapsible', false) || optionEquals(record, 'collapsable', false)) {
    return {collapsible: false, collapsed: false}
  }

  const collapsedOption = record?.['collapsed']
  const collapsed =
    typeof collapsedOption === 'boolean'
      ? collapsedOption
      : level >= AUTO_COLLAPSE_DEPTH || undefined

  return {
    collapsed,
    collapsible:
      optionEquals(record, 'collapsible', true) ||
      optionEquals(record, 'collapsable', true) ||
      collapsed === true ||
      undefined,
  }
}

function arrayFieldSetsCollapse(arrayFieldOptions: unknown): boolean {
  return (
    isOptionRecord(arrayFieldOptions) &&
    COLLAPSE_OPTION_KEYS.some((key) => Object.hasOwn(arrayFieldOptions, key))
  )
}

/**
 * Flags to put on an object `value` field member.
 *
 * Studio decides `member.collapsed` from the shared value type, before field
 * options are copied, so `collapsed` on the array field never reaches the
 * object. Returns the flags that object should use instead. A boolean that
 * differs from the value type's own default is an editor toggle and is kept.
 * Primitive values are left alone: Studio does not collapse them.
 */
export function collapseFlagsForValueField(args: {
  jsonType: string | undefined
  arrayFieldOptions: unknown
  valueFieldOptions: unknown
  mergedOptions: unknown
  level: number | undefined
  currentCollapsed: boolean | undefined
}): CollapseFlags | undefined {
  if (args.jsonType !== 'object' || !arrayFieldSetsCollapse(args.arrayFieldOptions)) {
    return undefined
  }

  const level = args.level ?? 0
  const original = collapseStateFromOptions(args.valueFieldOptions, level)
  const next = collapseStateFromOptions(args.mergedOptions, level)

  if (next.collapsible === false) {
    return next
  }

  const editorToggled =
    typeof args.currentCollapsed === 'boolean' && args.currentCollapsed !== original.collapsed

  return {
    collapsed: editorToggled ? args.currentCollapsed : next.collapsed,
    collapsible: next.collapsible,
  }
}
