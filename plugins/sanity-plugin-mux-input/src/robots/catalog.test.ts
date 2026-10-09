import {describe, expect, test} from 'vitest'

import {
  availableWorkflow,
  buildRobotsParameters,
  confirmWarnings,
  defaultParamValues,
  DEFAULT_ROBOTS_WORKFLOW,
  isFieldVisible,
  paramsFromFormValues,
  type QuestionRow,
  ROBOTS_CATALOG,
  ROBOTS_CATALOG_BY_KEY,
  type RobotsParamField,
  type TaxonomyValue,
  validateParams,
  workflowUnavailableReason,
} from './catalog'
import {ROBOTS_WORKFLOWS, type RobotsWorkflow} from './types'

const ASSET = 'asset-1'

function definitionOf(workflow: RobotsWorkflow) {
  return ROBOTS_CATALOG_BY_KEY[workflow]
}

function paramsFor(
  workflow: RobotsWorkflow,
  changes: Record<string, unknown> = {},
  context = {},
): Record<string, unknown> {
  const definition = definitionOf(workflow)
  const values = {...defaultParamValues(definition.params), ...changes}
  return paramsFromFormValues(definition, ASSET, values, context)
}

function errorsFor(workflow: RobotsWorkflow, changes: Record<string, unknown> = {}, context = {}) {
  const definition = definitionOf(workflow)
  return validateParams(definition, {...defaultParamValues(definition.params), ...changes}, context)
}

function fieldOf(workflow: RobotsWorkflow, name: string): RobotsParamField {
  const field = definitionOf(workflow).params.find((param) => param.name === name)
  if (!field) throw new Error(`${workflow} has no ${name}`)
  return field
}

describe('the catalog itself', () => {
  test('covers exactly the twelve workflows', () => {
    expect(ROBOTS_CATALOG.map((definition) => definition.key).toSorted()).toEqual(
      [...ROBOTS_WORKFLOWS].toSorted(),
    )
  })

  test('uses a unique parameter name per workflow and never declares asset_id', () => {
    for (const definition of ROBOTS_CATALOG) {
      const names = definition.params.map((param) => param.name)
      expect(new Set(names).size).toBe(names.length)
      expect(names).not.toContain('asset_id')
    }
  })

  test('never offers an option labelled "Default"', () => {
    for (const definition of ROBOTS_CATALOG) {
      for (const field of definition.params) {
        for (const option of field.options ?? []) {
          expect(option.label).not.toMatch(/default/i)
        }
      }
    }
  })

  test('never sends a deprecated or left-out parameter', () => {
    for (const definition of ROBOTS_CATALOG) {
      for (const field of definition.params) {
        expect(field.name).not.toMatch(/^prompt_overrides|^replace_existing$|detection_method/)
      }
    }
  })

  test('opens on a workflow every asset can run', () => {
    expect(
      workflowUnavailableReason(definitionOf(DEFAULT_ROBOTS_WORKFLOW), {isAudioOnly: true}),
    ).toBeUndefined()
  })
})

describe('buildRobotsParameters', () => {
  test('supplies the asset id and expands dotted paths', () => {
    expect(
      buildRobotsParameters(ASSET, {'thresholds.sexual': 0.5, 'thresholds.violence': 0.9}),
    ).toEqual({asset_id: ASSET, thresholds: {sexual: 0.5, violence: 0.9}})
  })

  test('drops empty values and keeps a legitimate false and zero', () => {
    expect(
      buildRobotsParameters(ASSET, {a: '', b: [], c: undefined, d: null, e: false, f: 0}),
    ).toEqual({asset_id: ASSET, e: false, f: 0})
  })
})

describe('defaults and untouched fields', () => {
  test('a summarize run nobody changed sends only the asset id and the defaults', () => {
    expect(paramsFor('summarize')).toEqual({asset_id: ASSET, update_asset_meta: false})
  })

  test('"No preference" leaves the steering out', () => {
    expect(paramsFor('find-scenes', {'output_steering.title_style': ''})).not.toHaveProperty(
      'output_steering',
    )
  })

  test('text is sent trimmed, and blank text not at all', () => {
    expect(paramsFor('summarize', {'output_steering.audience': '  Marketers '})).toEqual({
      asset_id: ASSET,
      update_asset_meta: false,
      output_steering: {audience: 'Marketers'},
    })
    expect(paramsFor('summarize', {'output_steering.audience': '   '})).not.toHaveProperty(
      'output_steering',
    )
  })

  test('a hidden field is never sent', () => {
    const params = paramsFor('edit-captions', {
      'track_id': 'track-1',
      'censor_profanity': false,
      'auto_censor_profanity.always_censor': ['darn'],
    })
    expect(params).not.toHaveProperty('auto_censor_profanity')
    expect(params).not.toHaveProperty('censor_profanity')
  })

  test('moderate language_code only shows when the asset might be audio-only', () => {
    const field = fieldOf('moderate', 'language_code')
    expect(isFieldVisible(field, {}, {isAudioOnly: false})).toBe(false)
    expect(isFieldVisible(field, {}, {isAudioOnly: true})).toBe(true)
    expect(isFieldVisible(field, {}, {})).toBe(true)
  })
})

describe('replace_existing_tracks', () => {
  test.each(['generate-premium-captions', 'translate-captions', 'translate-audio'] as const)(
    '%s sends the documented fail by default, and only while the result is uploaded',
    (workflow) => {
      const base = {track_id: 'track-1', to_language_code: 'es'}
      expect(paramsFor(workflow, base)['replace_existing_tracks']).toBe('fail')
      expect(paramsFor(workflow, {...base, upload_to_mux: false})).not.toHaveProperty(
        'replace_existing_tracks',
      )
    },
  )

  test('translate-audio has no replace_generated: Mux never auto-generates audio', () => {
    const values = fieldOf('translate-audio', 'replace_existing_tracks').options?.map(
      (option) => option.value,
    )
    expect(values).toEqual(['fail', 'replace_all'])
  })

  test('warns at the confirm step on both replace values', () => {
    const definition = definitionOf('generate-premium-captions')
    const warn = (value: string) =>
      confirmWarnings(definition, {upload_to_mux: true, replace_existing_tracks: value})
    expect(warn('fail')).toEqual([])
    expect(warn('replace_all')[0]?.body).toMatch(/Any caption track/)
    expect(warn('replace_generated')[0]?.body).toMatch(/auto-generated caption track/)
    expect(
      confirmWarnings(definition, {upload_to_mux: false, replace_existing_tracks: 'replace_all'}),
    ).toEqual([])
  })
})

describe('moderate on_flagged', () => {
  test('sends nothing by default and the action once chosen', () => {
    expect(paramsFor('moderate')).not.toHaveProperty('on_flagged')
    expect(paramsFor('moderate', {'on_flagged.action': 'delete_playback_ids'})).toMatchObject({
      on_flagged: {action: 'delete_playback_ids'},
    })
  })

  test('names the damage at the confirm step', () => {
    const [warning] = confirmWarnings(definitionOf('moderate'), {
      'on_flagged.action': 'delete_playback_ids',
    })
    expect(warning?.title).toBe('This run can make the video unplayable')
    expect(warning?.body).toMatch(/not just in Sanity/)
  })
})

describe('generate-chapters', () => {
  test('sends update_asset_chapters: true by default and omits it when unticked', () => {
    expect(paramsFor('generate-chapters')['update_asset_chapters']).toBe(true)
    expect(paramsFor('generate-chapters', {update_asset_chapters: false})).not.toHaveProperty(
      'update_asset_chapters',
    )
  })

  test('needs a caption track, unless nobody knows', () => {
    expect(errorsFor('generate-chapters', {}, {hasCaptions: false})).toHaveLength(1)
    expect(errorsFor('generate-chapters', {}, {})).toEqual([])
  })
})

describe('edit-captions', () => {
  const base = {track_id: 'track-1'}

  test('needs a replacement, a speaker label or censoring', () => {
    expect(errorsFor('edit-captions', base)).toEqual([
      'Add a replacement rule or a speaker label, or turn on "Censor profanity".',
    ])
    const replacements = [{find: 'gonna', replace: 'going to', caseSensitive: false}]
    expect(errorsFor('edit-captions', {...base, replacements})).toEqual([])
    const speakers = [{find: 'Speaker 1', replace: 'Ana'}]
    expect(errorsFor('edit-captions', {...base, speaker_replacements: speakers})).toEqual([])
    expect(errorsFor('edit-captions', {...base, censor_profanity: true})).toEqual([])
  })

  test('sends speaker labels trimmed and drops rows missing a side', () => {
    const params = paramsFor('edit-captions', {
      ...base,
      speaker_replacements: [
        {find: ' Speaker 1 ', replace: 'Ana'},
        {find: 'Speaker 2', replace: ' '},
      ],
    })
    expect(params['speaker_replacements']).toEqual([{find: 'Speaker 1', replace: 'Ana'}])
  })

  test('sends the censor mode, and case_sensitive only when on', () => {
    const params = paramsFor('edit-captions', {
      ...base,
      censor_profanity: true,
      replacements: [
        {find: 'a', replace: 'b', caseSensitive: true},
        {find: 'c', replace: 'd', caseSensitive: false},
      ],
    })
    expect(params['auto_censor_profanity']).toEqual({mode: 'blank'})
    expect(params['replacements']).toEqual([
      {find: 'a', replace: 'b', case_sensitive: true},
      {find: 'c', replace: 'd'},
    ])
  })

  test('requires the track', () => {
    expect(errorsFor('edit-captions', {censor_profanity: true})).toEqual([
      'Caption track to edit is required.',
    ])
  })
})

describe('ask-questions', () => {
  const rows = (...questions: QuestionRow[]) => ({questions})

  test('sends options, the yes/no default or free-form replies, never both', () => {
    const params = paramsFor(
      'ask-questions',
      rows(
        {question: 'Which?', answerOptions: 'a, b', answerMode: 'options'},
        {question: 'Yes?', answerOptions: '', answerMode: 'options'},
        {question: 'Describe', answerOptions: 'ignored', answerMode: 'free_form'},
        {question: '  ', answerOptions: '', answerMode: 'options'},
      ),
    )
    expect(params['questions']).toEqual([
      {question: 'Which?', answer_options: ['a', 'b']},
      {question: 'Yes?'},
      {question: 'Describe', free_form_reply: true},
    ])
  })

  test('requires a question and enforces the documented limits', () => {
    expect(errorsFor('ask-questions')).toEqual(['Questions is required.'])
    const long = {question: 'x'.repeat(601), answerOptions: 'y'.repeat(151)}
    expect(errorsFor('ask-questions', rows(long))).toEqual([
      'A question can be at most 600 characters.',
      'An answer option can be at most 150 characters.',
    ])
    const many = Array.from({length: 51}, (_, i) => ({question: `Q${i}`, answerOptions: ''}))
    expect(errorsFor('ask-questions', rows(...many))).toEqual(['Questions: at most 50 entries.'])
  })
})

describe('find-key-moments', () => {
  test('needs captions or shots, and audio-only always needs captions', () => {
    expect(errorsFor('find-key-moments', {}, {hasCaptions: false})).toHaveLength(1)
    expect(errorsFor('find-key-moments', {use_shots: true}, {hasCaptions: false})).toEqual([])
    expect(
      errorsFor('find-key-moments', {use_shots: true}, {hasCaptions: false, isAudioOnly: true}),
    ).toHaveLength(2)
  })

  test('takes both highlight bounds or neither, min below max', () => {
    expect(errorsFor('find-key-moments', {'target_duration_ms.min': 1000})).toEqual([
      'Set both highlight length bounds, or neither.',
    ])
    expect(
      errorsFor('find-key-moments', {
        'target_duration_ms.min': 5000,
        'target_duration_ms.max': 1000,
      }),
    ).toEqual(['The minimum highlight length cannot exceed the maximum.'])
  })
})

describe('numbers', () => {
  test('refuses decimals where the spec says integer, and not elsewhere', () => {
    expect(errorsFor('summarize', {tag_count: 2.5})).toEqual([
      'Number of tags must be a whole number.',
    ])
    expect(errorsFor('moderate', {sampling_interval: 7.5})).toEqual([
      'Seconds between samples must be a whole number.',
    ])
    expect(errorsFor('moderate', {'thresholds.sexual': 0.65})).toEqual([])
    expect(errorsFor('summarize', {'output_steering.scope.start_time': 1.5})).toEqual([])
  })

  test('enforces the documented bounds', () => {
    expect(errorsFor('find-best-thumbnails', {max_thumbnails: 6})).toEqual([
      'Maximum candidates must be at most 5.',
    ])
    expect(errorsFor('moderate', {sampling_interval: 4})).toEqual([
      'Seconds between samples must be at least 5.',
    ])
    expect(errorsFor('find-scenes', {min_scene_duration_ms: 500})).toEqual([
      'Minimum scene length (ms) must be at least 1000.',
    ])
  })
})

describe('text and list limits', () => {
  test('caps audience, looking_for and campaign_style at 160 characters', () => {
    const long = 'x'.repeat(161)
    expect(errorsFor('summarize', {'output_steering.audience': long})).toEqual([
      'Audience can be at most 160 characters.',
    ])
    expect(
      errorsFor('find-best-thumbnails', {
        'output_steering.looking_for': long,
        'output_steering.campaign_style': long,
      }),
    ).toHaveLength(2)
  })

  test('caps brand terms at 10 of 40 characters', () => {
    const terms = Array.from({length: 11}, (_, i) => `term ${i}`)
    expect(errorsFor('summarize', {'output_steering.brand_terms': terms})).toEqual([
      'Brand terms: at most 10 entries.',
    ])
    expect(
      errorsFor('find-scenes', {'output_steering.brand_terms': ['x'.repeat(41)]}),
    ).toHaveLength(1)
  })

  test('caps never_translate and refuses angle brackets', () => {
    const base = {track_id: 'track-1', to_language_code: 'es'}
    expect(errorsFor('translate-captions', {...base, never_translate: ['<b>Mux</b>']})).toEqual([
      'Never translate cannot contain < or >: "<b>Mux</b>".',
    ])
    const many = Array.from({length: 101}, (_, i) => `term ${i}`)
    expect(errorsFor('translate-captions', {...base, never_translate: many})).toEqual([
      'Never translate: at most 100 entries.',
    ])
  })

  test('enforces the phrase-hint rules the input cannot', () => {
    expect(
      errorsFor('generate-premium-captions', {phrases: ['one two three four five six']}),
    ).toEqual(['Phrase hints can be at most 5 words: "one two three four five six".'])
    expect(errorsFor('generate-premium-captions', {phrases: ['Mux {Robots}']})).toEqual([
      'Phrase hints cannot contain < > { } [ ]: "Mux {Robots}".',
    ])
    expect(errorsFor('generate-premium-captions', {phrases: ['x'.repeat(50)]})).toHaveLength(1)
  })
})

describe('taxonomies', () => {
  const taxonomy = (value: Partial<TaxonomyValue>): TaxonomyValue => ({
    name: '',
    allowOther: true,
    values: [],
    ...value,
  })

  test('converts rows into the documented object, allow_other always sent', () => {
    const params = paramsFor('summarize', {
      'output_steering.tag_taxonomy': taxonomy({
        name: ' Topics ',
        allowOther: false,
        values: [
          {label: 'Video', description: 'Streaming', aliases: 'VOD, OTT'},
          {label: 'Audio', description: '', aliases: ''},
          {label: ' ', description: 'dropped', aliases: ''},
        ],
      }),
    })
    expect(params['output_steering']).toEqual({
      tag_taxonomy: {
        name: 'Topics',
        values: [
          {label: 'Video', description: 'Streaming', aliases: ['VOD', 'OTT']},
          {label: 'Audio'},
        ],
        allow_other: false,
      },
    })
  })

  test('sends nothing without values, and says so when a name was typed', () => {
    const named = {'output_steering.topic_taxonomy': taxonomy({name: 'Topics'})}
    expect(paramsFor('find-scenes', named)).not.toHaveProperty('output_steering')
    expect(errorsFor('find-scenes', named)).toEqual([
      'Topic taxonomy: add at least one value, or clear the taxonomy name.',
    ])
  })

  test('applies the documented caps to topic_taxonomy too, but not the 2000 total', () => {
    const values = Array.from({length: 51}, (_, i) => ({
      label: `Value ${i}`,
      description: 'x'.repeat(250),
      aliases: '',
    }))
    expect(
      errorsFor('find-key-moments', {'output_steering.topic_taxonomy': taxonomy({values})}),
    ).toEqual(['Topic taxonomy: at most 50 values.'])
    expect(
      errorsFor('summarize', {'output_steering.tag_taxonomy': taxonomy({values})}).some((error) =>
        error.includes('2000 characters'),
      ),
    ).toBe(true)
  })

  test('names an over-long label, description or alias', () => {
    const errors = errorsFor('summarize', {
      'output_steering.tag_taxonomy': taxonomy({
        values: [{label: 'x'.repeat(101), description: 'y'.repeat(301), aliases: 'z'.repeat(101)}],
      }),
    })
    expect(errors.join('\n')).toMatch(/a value is at most 100/)
    expect(errors.join('\n')).toMatch(/is at most 300 characters/)
    expect(errors.join('\n')).toMatch(/an alias is at most 100/)
  })
})

describe('the scope window', () => {
  const scoped = ROBOTS_CATALOG.filter((definition) =>
    definition.params.some((param) => param.name === 'output_steering.scope.start_time'),
  ).map((definition) => definition.key)

  test('is on the six workflows that document it', () => {
    expect(scoped.toSorted()).toEqual(
      [
        'ask-questions',
        'find-best-thumbnails',
        'find-key-moments',
        'find-scenes',
        'moderate',
        'summarize',
      ].toSorted(),
    )
  })

  test.each(scoped)('%s refuses an empty window and a start past the end', (workflow) => {
    const window = {'output_steering.scope.start_time': 30, 'output_steering.scope.end_time': 30}
    expect(errorsFor(workflow, window, {hasCaptions: true})).toContain(
      'The start time must be before the end time.',
    )
    expect(errorsFor(workflow, {'output_steering.scope.start_time': 90}, {duration: 60})).toContain(
      'The start time is past the end of the video, which is 60 seconds long.',
    )
  })

  test('sends the window nested', () => {
    expect(
      paramsFor('summarize', {
        'output_steering.scope.start_time': 5,
        'output_steering.scope.end_time': 20,
      })['output_steering'],
    ).toEqual({scope: {start_time: 5, end_time: 20}})
  })
})

describe('audio-only assets', () => {
  test('find-scenes and find-best-thumbnails are unavailable, and only them', () => {
    const unavailable = ROBOTS_CATALOG.filter((definition) =>
      workflowUnavailableReason(definition, {isAudioOnly: true}),
    ).map((definition) => definition.key)
    expect(unavailable.toSorted()).toEqual(['find-best-thumbnails', 'find-scenes'])
  })

  test('an unavailable choice falls back to the default', () => {
    expect(availableWorkflow('find-scenes', {isAudioOnly: true})).toBe(DEFAULT_ROBOTS_WORKFLOW)
    expect(availableWorkflow('find-scenes', {})).toBe('find-scenes')
  })
})
