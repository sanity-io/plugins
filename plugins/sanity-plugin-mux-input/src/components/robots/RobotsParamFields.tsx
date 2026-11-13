import {AddIcon} from '@sanity/icons/Add'
import {TrashIcon} from '@sanity/icons/Trash'
import {
  Box,
  Button,
  Card,
  Checkbox,
  Flex,
  Select,
  Stack,
  Text,
  TextArea,
  TextInput,
} from '@sanity/ui'
import {useId, useState} from 'react'

import {
  asTaxonomyValue,
  emptyQuestionRow,
  emptyTaxonomyRow,
  groupFieldsBySection,
  isFieldVisible,
  QUESTION_ANSWER_MODES,
  type QuestionRow,
  type ReplacementRow,
  type RobotsAssetContext,
  type RobotsParamField,
  type SpeakerReplacementRow,
  type TaxonomyRow,
} from '../../robots/catalog'
import {ROBOTS_VERIFIED_LANGUAGES} from '../../robots/languages'
import type {MuxTextTrack} from '../../util/types'
import FormField from '../FormField'

type OnChange = (name: string, value: unknown) => void

interface FieldProps {
  field: RobotsParamField
  value: unknown
  onChange: OnChange
  inputId: string
}

function RemoveButton({label, onClick}: {label: string; onClick: () => void}) {
  return (
    <Button
      icon={TrashIcon}
      mode="bleed"
      tone="critical"
      padding={2}
      aria-label={label}
      onClick={onClick}
    />
  )
}

function AddButton({text, onClick}: {text: string; onClick: () => void}) {
  return (
    <Box>
      <Button icon={AddIcon} text={text} mode="ghost" fontSize={1} padding={2} onClick={onClick} />
    </Box>
  )
}

function LabelledCheckbox({
  id,
  checked,
  label,
  onChange,
}: {
  id: string
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <Flex align="center" gap={2}>
      <Checkbox
        id={id}
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
      <Text size={1} as="label" htmlFor={id}>
        {label}
      </Text>
    </Flex>
  )
}

/** Interior spaces are kept: they're legal in every list this is used for. */
function splitLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

/**
 * Keeps the raw text being typed and sends only the normalised list, so trimming never eats a
 * trailing space or a new line mid-edit. The form remounts per workflow, so no re-seeding.
 */
function StringListInput({field, value, onChange, inputId}: FieldProps) {
  const items = Array.isArray(value) ? (value as string[]) : []
  const [draft, setDraft] = useState(() => items.join('\n'))
  return (
    <Stack gap={2}>
      <TextArea
        id={inputId}
        rows={2}
        placeholder="One per line"
        value={draft}
        onChange={(event) => {
          setDraft(event.currentTarget.value)
          onChange(field.name, splitLines(event.currentTarget.value))
        }}
      />
      {field.maxItems !== undefined && (
        <Text size={1} muted>
          {items.length} of {field.maxItems} used.
        </Text>
      )}
    </Stack>
  )
}

function RowLabel({htmlFor, children}: {htmlFor: string; children: string}) {
  return (
    <Text size={1} weight="medium" as="label" htmlFor={htmlFor}>
      {children}
    </Text>
  )
}

function QuestionsInput({field, value, onChange, inputId}: FieldProps) {
  const rows = Array.isArray(value) ? (value as QuestionRow[]) : [emptyQuestionRow()]
  const update = (next: QuestionRow[]) => onChange(field.name, next)
  const patch = (index: number, changes: Partial<QuestionRow>) =>
    update(rows.map((row, i) => (i === index ? {...row, ...changes} : row)))
  return (
    <Stack gap={2}>
      {rows.map((row, index) => {
        const number = index + 1
        const modeId = `${inputId}-answer-mode-${index}`
        const optionsId = `${inputId}-answer-options-${index}`
        const isFreeForm = row.answerMode === 'free_form'
        return (
          // oxlint-disable-next-line react/no-array-index-key -- controlled rows, no local state
          <Card key={index} padding={3} radius={2} border>
            <Stack gap={3}>
              <Flex gap={2} align="center">
                <Box flex={1}>
                  <TextInput
                    aria-label={`Question ${number}`}
                    placeholder="Is there a person on screen?"
                    value={row.question}
                    onChange={(event) => patch(index, {question: event.currentTarget.value})}
                  />
                </Box>
                <RemoveButton
                  label={`Remove question ${number}`}
                  onClick={() => update(rows.filter((_, i) => i !== index))}
                />
              </Flex>
              <Stack gap={2}>
                <RowLabel htmlFor={modeId}>Answer</RowLabel>
                <Select
                  id={modeId}
                  value={row.answerMode ?? 'options'}
                  onChange={(event) =>
                    patch(index, {
                      answerMode: event.currentTarget.value as QuestionRow['answerMode'],
                    })
                  }
                >
                  {QUESTION_ANSWER_MODES.map((mode) => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </Select>
              </Stack>
              {isFreeForm ? (
                <Text size={1} muted>
                  Mux answers in its own words. Treat the answer as generated text.
                </Text>
              ) : (
                <Stack gap={2}>
                  <RowLabel htmlFor={optionsId}>Answer options</RowLabel>
                  <TextInput
                    id={optionsId}
                    placeholder="yes, no"
                    value={row.answerOptions}
                    onChange={(event) => patch(index, {answerOptions: event.currentTarget.value})}
                  />
                  <Text size={1} muted>
                    Comma separated. Leave empty for yes or no.
                  </Text>
                </Stack>
              )}
            </Stack>
          </Card>
        )
      })}
      <AddButton text="Add question" onClick={() => update([...rows, emptyQuestionRow()])} />
    </Stack>
  )
}

function ReplacementsInput({field, value, onChange}: FieldProps) {
  const rows = Array.isArray(value) ? (value as ReplacementRow[]) : []
  const update = (next: ReplacementRow[]) => onChange(field.name, next)
  const patch = (index: number, changes: Partial<ReplacementRow>) =>
    update(rows.map((row, i) => (i === index ? {...row, ...changes} : row)))
  return (
    <Stack gap={2}>
      {rows.map((row, index) => (
        // oxlint-disable-next-line react/no-array-index-key -- controlled rows, no local state
        <Flex key={index} gap={2} align="center" wrap="wrap">
          <Box flex={1}>
            <TextInput
              aria-label={`Find text ${index + 1}`}
              placeholder="Find"
              value={row.find}
              onChange={(event) => patch(index, {find: event.currentTarget.value})}
            />
          </Box>
          <Box flex={1}>
            <TextInput
              aria-label={`Replacement text ${index + 1}`}
              placeholder="Replace with"
              value={row.replace}
              onChange={(event) => patch(index, {replace: event.currentTarget.value})}
            />
          </Box>
          <LabelledCheckbox
            id={`${field.name}-case-${index}`}
            label="Case sensitive"
            checked={row.caseSensitive}
            onChange={(caseSensitive) => patch(index, {caseSensitive})}
          />
          <RemoveButton
            label={`Remove replacement ${index + 1}`}
            onClick={() => update(rows.filter((_, i) => i !== index))}
          />
        </Flex>
      ))}
      <AddButton
        text="Add replacement"
        onClick={() => update([...rows, {find: '', replace: '', caseSensitive: false}])}
      />
    </Stack>
  )
}

function SpeakerReplacementsInput({field, value, onChange}: FieldProps) {
  const rows = Array.isArray(value) ? (value as SpeakerReplacementRow[]) : []
  const update = (next: SpeakerReplacementRow[]) => onChange(field.name, next)
  const patch = (index: number, changes: Partial<SpeakerReplacementRow>) =>
    update(rows.map((row, i) => (i === index ? {...row, ...changes} : row)))
  return (
    <Stack gap={2}>
      {rows.map((row, index) => (
        // oxlint-disable-next-line react/no-array-index-key -- controlled rows, no local state
        <Flex key={index} gap={2} align="center">
          <Box flex={1}>
            <TextInput
              aria-label={`Current speaker label ${index + 1}`}
              placeholder="Speaker 1"
              value={row.find}
              onChange={(event) => patch(index, {find: event.currentTarget.value})}
            />
          </Box>
          <Box flex={1}>
            <TextInput
              aria-label={`New speaker label ${index + 1}`}
              placeholder="New label"
              value={row.replace}
              onChange={(event) => patch(index, {replace: event.currentTarget.value})}
            />
          </Box>
          <RemoveButton
            label={`Remove speaker label ${index + 1}`}
            onClick={() => update(rows.filter((_, i) => i !== index))}
          />
        </Flex>
      ))}
      <AddButton
        text="Add speaker label"
        onClick={() => update([...rows, {find: '', replace: ''}])}
      />
    </Stack>
  )
}

function TaxonomyInput({field, value, onChange, inputId}: FieldProps) {
  const taxonomy = asTaxonomyValue(value)
  const patch = (changes: Partial<typeof taxonomy>) =>
    onChange(field.name, {...taxonomy, ...changes})
  const patchRow = (index: number, changes: Partial<TaxonomyRow>) =>
    patch({values: taxonomy.values.map((row, i) => (i === index ? {...row, ...changes} : row))})
  return (
    <Stack gap={2}>
      <TextInput
        id={inputId}
        aria-label="Taxonomy name"
        placeholder="Taxonomy name, e.g. Content pillars"
        value={taxonomy.name}
        onChange={(event) => patch({name: event.currentTarget.value})}
      />
      {taxonomy.values.map((row, index) => (
        // oxlint-disable-next-line react/no-array-index-key -- controlled rows, no local state
        <Flex key={index} gap={2} align="center" wrap="wrap">
          <Box flex={1}>
            <TextInput
              aria-label={`Taxonomy value ${index + 1}`}
              placeholder="Value"
              value={row.label}
              onChange={(event) => patchRow(index, {label: event.currentTarget.value})}
            />
          </Box>
          <Box flex={2}>
            <TextInput
              aria-label={`When value ${index + 1} applies`}
              placeholder="When it applies"
              value={row.description}
              onChange={(event) => patchRow(index, {description: event.currentTarget.value})}
            />
          </Box>
          <Box flex={1}>
            <TextInput
              aria-label={`Aliases for value ${index + 1}`}
              placeholder="Aliases, comma separated"
              value={row.aliases}
              onChange={(event) => patchRow(index, {aliases: event.currentTarget.value})}
            />
          </Box>
          <RemoveButton
            label={`Remove taxonomy value ${index + 1}`}
            onClick={() => patch({values: taxonomy.values.filter((_, i) => i !== index)})}
          />
        </Flex>
      ))}
      <AddButton
        text="Add value"
        onClick={() => patch({values: [...taxonomy.values, emptyTaxonomyRow()]})}
      />
      <LabelledCheckbox
        id={`${inputId}-allow-other`}
        label="Allow values outside this list"
        checked={taxonomy.allowOther}
        onChange={(allowOther) => patch({allowOther})}
      />
    </Stack>
  )
}

function EnumListInput({field, value, onChange, inputId}: FieldProps) {
  const selected = Array.isArray(value) ? (value as string[]) : []
  return (
    <Stack gap={2}>
      {(field.options ?? []).map((option) => (
        <LabelledCheckbox
          key={option.value}
          id={`${inputId}-${option.value}`}
          label={option.label}
          checked={selected.includes(option.value)}
          onChange={(checked) =>
            onChange(
              field.name,
              checked
                ? [...selected, option.value]
                : selected.filter((entry) => entry !== option.value),
            )
          }
        />
      ))}
    </Stack>
  )
}

function Control({
  field,
  value,
  onChange,
  inputId,
  captionTracks,
  languageListId,
}: FieldProps & {captionTracks: MuxTextTrack[]; languageListId: string}) {
  switch (field.kind) {
    case 'select':
      return (
        <Select
          id={inputId}
          value={(value as string | undefined) ?? (field.defaultValue as string | undefined) ?? ''}
          onChange={(event) => onChange(field.name, event.currentTarget.value)}
        >
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      )
    case 'number':
      return (
        <TextInput
          id={inputId}
          type="number"
          min={field.min}
          max={field.max}
          step={field.step}
          value={value === undefined ? '' : String(value)}
          // Empty means "leave this parameter out", not zero.
          onChange={(event) =>
            onChange(
              field.name,
              event.currentTarget.value === '' ? undefined : Number(event.currentTarget.value),
            )
          }
        />
      )
    case 'language':
      return (
        <TextInput
          id={inputId}
          list={languageListId}
          placeholder={field.placeholder ?? 'en'}
          value={(value as string | undefined) ?? ''}
          onChange={(event) => onChange(field.name, event.currentTarget.value.trim())}
        />
      )
    case 'track':
      return captionTracks.length === 0 ? (
        <Text size={1} muted>
          This video has no caption track to use.
        </Text>
      ) : (
        <Select
          id={inputId}
          value={(value as string | undefined) ?? ''}
          onChange={(event) => onChange(field.name, event.currentTarget.value)}
        >
          <option value="">Select a track</option>
          {captionTracks.map((track) => (
            <option key={track.id} value={track.id}>
              {[track.name, track.language_code].filter(Boolean).join(' · ') || track.id}
            </option>
          ))}
        </Select>
      )
    case 'stringList':
      return <StringListInput field={field} value={value} onChange={onChange} inputId={inputId} />
    case 'enumList':
      return <EnumListInput field={field} value={value} onChange={onChange} inputId={inputId} />
    case 'questions':
      return <QuestionsInput field={field} value={value} onChange={onChange} inputId={inputId} />
    case 'replacements':
      return <ReplacementsInput field={field} value={value} onChange={onChange} inputId={inputId} />
    case 'speakerReplacements':
      return (
        <SpeakerReplacementsInput
          field={field}
          value={value}
          onChange={onChange}
          inputId={inputId}
        />
      )
    case 'taxonomy':
      return <TaxonomyInput field={field} value={value} onChange={onChange} inputId={inputId} />
    default:
      return (
        <TextInput
          id={inputId}
          placeholder={field.placeholder}
          value={(value as string | undefined) ?? ''}
          onChange={(event) => onChange(field.name, event.currentTarget.value)}
        />
      )
  }
}

export function RobotsParamFields({
  fields,
  values,
  onChange,
  captionTracks,
  context,
}: {
  fields: RobotsParamField[]
  values: Record<string, unknown>
  onChange: OnChange
  captionTracks: MuxTextTrack[]
  context: RobotsAssetContext
}) {
  const id = useId()
  const languageListId = `robots-languages${id}`
  if (fields.length === 0) {
    return (
      <Text size={1} muted>
        This workflow takes no options.
      </Text>
    )
  }

  const renderField = (field: RobotsParamField) => {
    const inputId = `${id}-${field.name}`
    const value = values[field.name]
    if (field.kind === 'boolean') {
      return (
        <Stack key={field.name} gap={2}>
          <LabelledCheckbox
            id={inputId}
            label={field.label}
            checked={value === undefined ? !!field.defaultValue : value === true}
            onChange={(checked) => onChange(field.name, checked)}
          />
          {field.helpText && (
            <Box paddingLeft={4}>
              <Text size={1} muted>
                {field.helpText}
              </Text>
            </Box>
          )}
        </Stack>
      )
    }
    return (
      <FormField
        key={field.name}
        inputId={inputId}
        title={field.isRequired ? `${field.label} *` : field.label}
        description={field.helpText}
      >
        <Control
          field={field}
          value={value}
          onChange={onChange}
          inputId={inputId}
          captionTracks={captionTracks}
          languageListId={languageListId}
        />
      </FormField>
    )
  }

  return (
    <Stack gap={4}>
      {fields.some((field) => field.kind === 'language') && (
        <datalist id={languageListId}>
          {ROBOTS_VERIFIED_LANGUAGES.map((language) => (
            <option key={language.code} value={language.code}>
              {language.label}
            </option>
          ))}
        </datalist>
      )}
      {groupFieldsBySection(fields.filter((field) => isFieldVisible(field, values, context))).map(
        (group) =>
          group.section ? (
            <Card key={group.section.id} padding={3} radius={2} border tone="transparent">
              <Stack gap={4}>
                <Stack gap={2}>
                  <Text size={1} weight="semibold">
                    {group.section.title}
                  </Text>
                  {group.section.description && (
                    <Text size={1} muted>
                      {group.section.description}
                    </Text>
                  )}
                </Stack>
                {group.fields.map(renderField)}
              </Stack>
            </Card>
          ) : (
            group.fields.map(renderField)
          ),
      )}
    </Stack>
  )
}
