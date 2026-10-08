import type {ObjectSchemaType, SchemaType} from 'sanity'

import type {RobotsSummarizeOutput} from './types'

/**
 * Copies a stored summary into the editor's own fields of the document that holds the video.
 * Nothing goes to Mux. Field types are checked before anything is offered, and a field that
 * already has content is only replaced when picked by hand.
 */

export type SummaryOutputKey = 'title' | 'description' | 'tags'

/** `text` takes a string, `list` an array of strings. */
type SummaryValueKind = 'text' | 'list'

export interface SummaryOutputRow {
  key: SummaryOutputKey
  label: string
  kind: SummaryValueKind
  value: string | string[]
}

export interface SummaryTargetField {
  name: string
  title: string
  kind: SummaryValueKind
}

export type SummaryTargets = Partial<Record<SummaryOutputKey, string>>

/** The summary's outputs that have a value, in the order the dialog lists them. */
export function summaryOutputRows(summary: RobotsSummarizeOutput | undefined): SummaryOutputRow[] {
  const rows: SummaryOutputRow[] = []
  if (summary?.title?.trim()) {
    rows.push({key: 'title', label: 'Title', kind: 'text', value: summary.title})
  }
  if (summary?.description?.trim()) {
    rows.push({key: 'description', label: 'Description', kind: 'text', value: summary.description})
  }
  if (summary?.tags?.length)
    rows.push({key: 'tags', label: 'Tags', kind: 'list', value: summary.tags})
  return rows
}

/** Built-in string types that hold something other than free text. */
const NOT_FREE_TEXT = new Set(['url', 'email', 'date', 'datetime', 'slug'])

function typeNames(type: SchemaType | undefined): string[] {
  const names: string[] = []
  for (let current = type; current; current = current.type) names.push(current.name)
  return names
}

/** Free text: a string or text field without a fixed list of values. */
function isFreeText(type: SchemaType | undefined): boolean {
  const names = typeNames(type)
  return (
    (names.includes('string') || names.includes('text')) &&
    !names.some((name) => NOT_FREE_TEXT.has(name)) &&
    !(type?.options as {list?: unknown} | undefined)?.list
  )
}

/**
 * The document's own fields a summary can be written to: free text for the title and the
 * description, a list of free text for the tags. Read-only and hidden fields aren't offered.
 */
export function summaryTargetFields(
  documentType: ObjectSchemaType | undefined,
): SummaryTargetField[] {
  return (documentType?.fields ?? []).flatMap((field): SummaryTargetField[] => {
    const {type} = field
    if (type.readOnly === true || type.hidden === true) return []
    const title = type.title ?? field.name
    if (isFreeText(type)) return [{name: field.name, title, kind: 'text'}]
    const isList =
      type.jsonType === 'array' &&
      type.of.length > 0 &&
      type.of.every(isFreeText) &&
      !(type.options as {list?: unknown} | undefined)?.list
    return isList ? [{name: field.name, title, kind: 'list'}] : []
  })
}

export function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === 'string') return value.trim() === ''
  return Array.isArray(value) && value.length === 0
}

/** A field named like the output and still empty. One with content is left for the editor. */
export function defaultSummaryTargets(
  rows: SummaryOutputRow[],
  fields: SummaryTargetField[],
  document: Record<string, unknown>,
): SummaryTargets {
  const targets: SummaryTargets = {}
  for (const row of rows) {
    const field = fields.find((entry) => entry.name === row.key && entry.kind === row.kind)
    if (field && isEmptyValue(document[field.name])) targets[row.key] = field.name
  }
  return targets
}

/** Points `key` at `fieldName`, taking it from any other output so no field is written twice. */
export function pickSummaryTarget(
  targets: SummaryTargets,
  key: SummaryOutputKey,
  fieldName: string | undefined,
): SummaryTargets {
  const next: SummaryTargets = {}
  for (const [otherKey, otherField] of Object.entries(targets) as [SummaryOutputKey, string][]) {
    if (otherKey !== key && otherField !== fieldName) next[otherKey] = otherField
  }
  if (fieldName) next[key] = fieldName
  return next
}

/** The values to set on the document, by field name. */
export function summaryFieldValues(
  rows: SummaryOutputRow[],
  targets: SummaryTargets,
): Record<string, string | string[]> {
  const values: Record<string, string | string[]> = {}
  for (const row of rows) {
    const fieldName = targets[row.key]
    if (fieldName) values[fieldName] = row.value
  }
  return values
}
