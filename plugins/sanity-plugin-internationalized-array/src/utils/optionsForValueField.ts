/**
 * Option keys this plugin stores on the internationalized array type.
 * They configure languages and validation, and are not options of the
 * underlying value field (string, file, image, and so on).
 */
const PLUGIN_OPTION_KEYS = new Set(['apiVersion', 'languages', 'select'])

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
